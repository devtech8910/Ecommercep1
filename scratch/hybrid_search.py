# hybrid_search.py
# AI-Powered Fashion Store Hybrid Search Engine
# Dependencies required:
# pip install sentence-transformers qdrant-client rank-bm25 NumPy

import numpy as np
import re
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http import models

class FashionSearchEngine:
    def __init__(self, collection_name: str = "fashion_products"):
        self.collection_name = collection_name
        
        # Initialize SentenceTransformer model (384 dimensions)
        print("Initializing Embedding Model (all-MiniLM-L6-v2)...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize Qdrant local client in memory for production-like standalone behavior
        print("Connecting to local in-memory Qdrant instance...")
        self.client = QdrantClient(":memory:")
        self.vector_size = 384
        
        self._setup_collection()
        
        # Common fashion adjectives for stripping fallback
        self.fashion_adjectives = {
            "boho", "chic", "summer", "casual", "premium", "luxury", "warm", "cool", 
            "comfy", "elegant", "classic", "modern", "retro", "stylish", "vintage", 
            "gorgeous", "beautiful", "comfy", "trendy", "formal", "designer"
        }

    def _setup_collection(self):
        """Creates the Qdrant collection with dense vector indexes."""
        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=models.VectorParams(
                size=self.vector_size,
                distance=models.Distance.COSINE
            )
        )
        # Enable full-text keyword indexing on metadata payload attributes
        self.client.create_payload_index(
            collection_name=self.collection_name,
            field_name="search_text",
            field_schema=models.TextIndexParams(
                type="text",
                tokenizer=models.TokenizerType.WORD,
                min_token_len=2,
                max_token_len=15,
                lowercase=True
            )
        )
        print(f"Schema Setup Successful: Collection '{self.collection_name}' ready.")

    def prepare_product_text(self, product: Dict[str, Any]) -> str:
        """Concatenates attributes into a single descriptive string for embedding generation."""
        tags_str = ", ".join(product.get("style_tags", []))
        desc = (
            f"A {product.get('color', '')} {product.get('material', '')} {product.get('title', '')} "
            f"by {product.get('brand', '')}. Style: {tags_str}. "
            f"Price: {product.get('price', 0)} INR. Status: {product.get('stock_status', 'in-stock')}."
        )
        # Clean extra whitespaces
        return re.sub(r'\s+', ' ', desc).strip()

    def upsert_products(self, products: List[Dict[str, Any]]):
        """Ingests fashion product list, generates dense embeddings, and writes to Qdrant."""
        points = []
        for idx, prod in enumerate(products):
            # Generate description
            search_text = self.prepare_product_text(prod)
            
            # Generate embedding vector
            vector = self.model.encode(search_text).tolist()
            
            # Package payload
            payload = {
                "id": prod.get("id", idx),
                "title": prod.get("title", ""),
                "brand": prod.get("brand", ""),
                "color": prod.get("color", ""),
                "material": prod.get("material", ""),
                "style_tags": prod.get("style_tags", []),
                "price": float(prod.get("price", 0)),
                "sizes": prod.get("sizes", []),
                "stock_status": prod.get("stock_status", "in-stock"),
                "search_text": search_text
            }
            
            points.append(
                models.PointStruct(
                    id=prod.get("id", idx),
                    vector=vector,
                    payload=payload
                )
            )
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        print(f"Successfully ingested and vectorized {len(products)} products.")

    def _build_filter(self, max_price: Optional[float] = None, size: Optional[str] = None) -> models.Filter:
        """Builds strict pre-filters for out-of-stock items and user facets (size, max price)."""
        conditions = [
            # Hard filter: exclude out-of-stock items
            models.FieldCondition(
                key="stock_status",
                match=models.MatchValue(value="in-stock")
            )
        ]
        
        if max_price is not None:
            conditions.append(
                models.FieldCondition(
                    key="price",
                    range=models.Range(lte=max_price)
                )
            )
            
        if size is not None:
            conditions.append(
                models.FieldCondition(
                    key="sizes",
                    match=models.MatchValue(value=size)
                )
            )
            
        return models.Filter(must=conditions)

    def search(self, query: str, max_price: Optional[float] = None, size: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """Performs hybrid search using Reciprocal Rank Fusion (RRF) combining semantic and keyword matching."""
        
        # Build hard filtering rules
        query_filter = self._build_filter(max_price, size)
        
        # 1. Semantic (Dense Vector) Match
        query_vector = self.model.encode(query).tolist()
        semantic_response = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=query_filter,
            limit=limit * 2
        )
        semantic_results = [p for p in semantic_response.points if p.score >= 0.40]
        
        # 2. Sparse (Full-text keyword index) Match
        keyword_results = self.client.scroll(
            collection_name=self.collection_name,
            scroll_filter=models.Filter(
                must=[
                    query_filter,
                    models.FieldCondition(
                        key="search_text",
                        match=models.MatchText(text=query)
                    )
                ]
            ),
            limit=limit * 2
        )[0]
        
        # If both yield zero results, trigger the fallback pipeline
        if not semantic_results and not keyword_results:
            print(f"[WARNING] Query '{query}' yielded zero results. Invoking Fallback Broad Search...")
            return self.fallback_keyword_search(query, max_price, size, limit)

        # 3. Reciprocal Rank Fusion (RRF) Combination
        # Score formula: RRF(doc) = Sum_m ( 1 / (k + rank_m) )
        # Using standard constant k = 60
        k = 60
        rrf_scores = {}
        payloads = {}
        
        # Dense ranks
        for rank, item in enumerate(semantic_results):
            doc_id = item.id
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (k + (rank + 1)))
            payloads[doc_id] = item.payload
            
        # Sparse ranks
        for rank, item in enumerate(keyword_results):
            doc_id = item.id
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (k + (rank + 1)))
            payloads[doc_id] = item.payload
            
        # Sort by RRF score descending
        sorted_ids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)
        
        results = []
        for doc_id in sorted_ids[:limit]:
            results.append({
                "product": payloads[doc_id],
                "rrf_score": rrf_scores[doc_id]
            })
            
        return results

    def fallback_keyword_search(self, query: str, max_price: Optional[float] = None, size: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """Fallback: Strips descriptive fashion adjectives and runs a broader query search to ensure results."""
        tokens = query.lower().split()
        # Filter out adjectives
        broad_tokens = [t for t in tokens if t not in self.fashion_adjectives]
        broad_query = " ".join(broad_tokens)
        
        if not broad_query:
            broad_query = query  # Keep original if stripped to empty
            
        print(f"[FALLBACK] Stripped query: '{query}' -> '{broad_query}'")
        
        query_filter = self._build_filter(max_price, size)
        
        # Perform broader keyword matching scroll
        results = self.client.scroll(
            collection_name=self.collection_name,
            scroll_filter=models.Filter(
                must=[
                    query_filter,
                    models.FieldCondition(
                        key="search_text",
                        match=models.MatchText(text=broad_query)
                    )
                ]
            ),
            limit=limit
        )[0]
        
        return [{
            "product": item.payload,
            "rrf_score": 1.0,
            "is_fallback": True
        } for item in results]

    def visual_search_hook(self, image_data: bytes, max_price: Optional[float] = None, size: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Placeholder Visual Search Hook.
        Pre-configured structurally to accept image byte streams and run CLIP multimodal embedding lookups.
        """
        # 1. Transform raw image stream (CLIP expects PIL image or torchvision tensor)
        # 2. Extract image embedding: image_features = clip_model.encode_image(image)
        # 3. Query Qdrant using the image embedding vector:
        #    self.client.search(collection_name=self.collection_name, query_vector=image_features.tolist())
        print("📸 Visual CLIP Multimodal Search Hook Triggered. Image buffer bytes length:", len(image_data))
        return []

# ============================================================
# PIPELINE VERIFICATION SUITE
# ============================================================
if __name__ == "__main__":
    # 1. Setup Sample Catalog
    sample_catalog = [
        {
            "id": 1,
            "title": "Summer Maxi Dress",
            "brand": "Boho Collective",
            "color": "Floral Blue",
            "material": "Cotton",
            "style_tags": ["boho", "chic", "maxi", "dress", "summer"],
            "price": 4500.0,
            "sizes": ["S", "M", "L"],
            "stock_status": "in-stock"
        },
        {
            "id": 2,
            "title": "Classic Wool Jacket",
            "brand": "Nordic Wear",
            "color": "Charcoal Grey",
            "material": "Wool",
            "style_tags": ["warm", "winter", "jacket", "formal"],
            "price": 8999.0,
            "sizes": ["M", "L", "XL"],
            "stock_status": "in-stock"
        },
        {
            "id": 3,
            "title": "Casual Denim Jeans",
            "brand": "Levi Strauss",
            "color": "Indigo Blue",
            "material": "Denim",
            "style_tags": ["casual", "jeans", "classic"],
            "price": 3200.0,
            "sizes": ["30", "32", "34"],
            "stock_status": "out-of-stock"  # Should be filtered out
        },
        {
            "id": 4,
            "title": "Boho Linen Peasant Skirt",
            "brand": "Zara Style",
            "color": "Ivory White",
            "material": "Linen",
            "style_tags": ["boho", "chic", "skirt", "summer"],
            "price": 2800.0,
            "sizes": ["M", "L"],
            "stock_status": "in-stock"
        }
    ]

    # Initialize Engine
    engine = FashionSearchEngine()
    engine.upsert_products(sample_catalog)

    print("\n--- TEST 1: Semantic Query 'warm winter outfit' ---")
    results_1 = engine.search("warm winter outfit")
    for r in results_1:
        print(f"Match: {r['product']['title']} | Brand: {r['product']['brand']} | Price: INR {r['product']['price']} | RRF Score: {r['rrf_score']:.4f}")

    print("\n--- TEST 2: Hard Filter - Out of stock verification ---")
    # Search for 'denim jeans' which is out of stock (ID 3)
    results_2 = engine.search("denim jeans")
    print(f"Matches for 'denim jeans': {len(results_2)} (Expected: 0, since it's out of stock)")

    print("\n--- TEST 3: Dynamic Facets - size M and Max Price 5000 ---")
    # Searches for 'boho chic dress' under INR 5000 in size M
    results_3 = engine.search("boho chic dress", max_price=5000.0, size="M")
    for r in results_3:
        print(f"Match: {r['product']['title']} | Size: {r['product']['sizes']} | Price: INR {r['product']['price']}")

    print("\n--- TEST 4: Fallback Search Verification ---")    # Query with non-existent term + common fashion adjectives
    # Should strip "elegant casual chic" and retry broader term "tuxedo"
    results_4 = engine.search("elegant casual chic tuxedo")
    print(f"Broad search fallback query matches: {len(results_4)}")
