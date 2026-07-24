# backend/dynamic_search_ranking.py
import json

def get_normalized_list(values):
    """
    Applies Min-Max Normalization to a list of numerical values.
    Returns a list of normalized floats in range [0.0, 1.0].
    """
    if not values:
        return []
    min_val = min(values)
    max_val = max(values)
    diff = max_val - min_val
    if diff == 0:
        return [1.0] * len(values)  # Avoid division by zero, all elements get max score
    return [(v - min_val) / diff for v in values]

def calculate_relevance_rank_score(products, text_match_scores):
    """
    Calculates combined relevance scores for a list of products.
    
    Formula:
      Final Score = (Text Match Score * 0.50) + 
                    (Normalized Review Score * 0.25) + 
                    (Normalized Click/Purchase Counter * 0.25)
                    
    Overrides:
      - Out-of-Stock Penalty: Multiplies final score by 0.1 if stock count is 0.
      - New Arrival Boost: Multiplies final score by 1.15 if 'new_arrival' flag is True.
    """
    if not products:
        return []

    # Extract raw scores for normalization
    raw_reviews = [p.get('review_score', 0.0) for p in products]
    raw_clicks = [p.get('click_purchase_count', 0) for p in products]

    # Normalize scores across the search result set
    norm_reviews = get_normalized_list(raw_reviews)
    norm_clicks = get_normalized_list(raw_clicks)

    ranked_products = []
    for idx, product in enumerate(products):
        text_score = text_match_scores[idx]
        norm_review = norm_reviews[idx]
        norm_click = norm_clicks[idx]

        # 1. Calculate weighted baseline score
        final_score = (text_score * 0.50) + (norm_review * 0.25) + (norm_click * 0.25)

        # 2. Apply business logic overrides
        is_out_of_stock = product.get('stock_count', 0) == 0
        is_new_arrival = product.get('new_arrival', False)

        # Apply overrides sequentially
        if is_out_of_stock:
            final_score *= 0.10  # Hard penalty
        
        if is_new_arrival:
            final_score *= 1.15  # Dynamic boost

        # Create copy of product dictionary and append score details
        ranked_product = product.copy()
        ranked_product['relevance_rank_score'] = round(final_score, 4)
        ranked_product['normalized_review'] = round(norm_review, 4)
        ranked_product['normalized_click'] = round(norm_click, 4)
        ranked_product['text_match_score'] = text_score
        
        ranked_products.append(ranked_product)

    # 3. Sort products by final score in descending order
    ranked_products.sort(key=lambda p: p['relevance_rank_score'], reverse=True)
    return ranked_products

# =====================================================================
# TEST SUITE & VERIFICATION
# =====================================================================
def run_verification_tests():
    print("=" * 75)
    print("RUNNING RELEVANCE SEARCH RANKING VERIFICATION TESTS")
    print("=" * 75)

    # Mock products dataset
    mock_products = [
        {
            "id": 1,
            "title": "Premium Indigo Denim Jacket",
            "review_score": 4.8,            # High reviews
            "click_purchase_count": 120,    # High clicks
            "stock_count": 15,              # In stock
            "new_arrival": False
        },
        {
            "id": 2,
            "title": "Vintage Leather Bomber Jacket",
            "review_score": 4.9,            # Highest reviews
            "click_purchase_count": 140,    # Highest clicks
            "stock_count": 0,               # OUT OF STOCK (Should drop to bottom!)
            "new_arrival": False
        },
        {
            "id": 3,
            "title": "Minimalist Black Trench Coat",
            "review_score": 4.2,            # Low reviews
            "click_purchase_count": 40,     # Low clicks
            "stock_count": 5,               # In stock
            "new_arrival": True             # NEW ARRIVAL (Should receive 1.15x boost!)
        },
        {
            "id": 4,
            "title": "Savile Row Double-Breasted Suit",
            "review_score": 4.5,
            "click_purchase_count": 75,
            "stock_count": 8,
            "new_arrival": False
        }
    ]

    # Baseline text similarity match scores (mocked from BM25 / Cosine Similarity)
    # Mocking higher relevance for the leather bomber jacket
    mock_text_scores = [0.85, 0.95, 0.70, 0.60]

    print("Baseline Mock Input Scores:")
    for idx, p in enumerate(mock_products):
        print(f" - {p['title']}: TextMatch={mock_text_scores[idx]}, Review={p['review_score']}, Clicks={p['click_purchase_count']}, Stock={p['stock_count']}, New={p['new_arrival']}")
    print("-" * 75)

    # Execute ranking layer
    ranked_results = calculate_relevance_rank_score(mock_products, mock_text_scores)

    # Display ranked output table
    print(f"{'Rank':<5} | {'Product Title':<30} | {'Text Score':<10} | {'Final Score':<12} | {'Status':<12}")
    print("-" * 75)
    for rank, p in enumerate(ranked_results, 1):
        status = "Out of Stock" if p['stock_count'] == 0 else ("New Arrival" if p['new_arrival'] else "Standard")
        print(f"{rank:<5} | {p['title']:<30} | {p['text_match_score']:<10} | {p['relevance_rank_score']:<12} | {status:<12}")
    
    print("-" * 75)

    # Assertions
    # 1. Vintage Leather Bomber Jacket has high text relevance (0.95) but is out-of-stock.
    # It must drop to the bottom (last index) due to the 0.1 penalty.
    bottom_product = ranked_results[-1]
    assert bottom_product['id'] == 2, f"Assertion Failed: Out of stock item did not drop to the bottom! Bottom item: {bottom_product['title']}"
    print("[PASSED] Out-of-stock item dropped to the bottom successfully.")

    # 2. Minimalist Black Trench Coat is a new arrival and should have a boost applied.
    coat_result = next(p for p in ranked_results if p['id'] == 3)
    base_score = (coat_result['text_match_score'] * 0.50) + (coat_result['normalized_review'] * 0.25) + (coat_result['normalized_click'] * 0.25)
    expected_boosted_score = round(base_score * 1.15, 4)
    assert coat_result['relevance_rank_score'] == expected_boosted_score, f"Assertion Failed: New arrival boost calculation mismatch! Expected: {expected_boosted_score}, Got: {coat_result['relevance_rank_score']}"
    print("[PASSED] New arrival boost multiplier successfully applied.")

    print("\n[SUCCESS] ALL SEARCH RANKING TESTS PASSED SUCCESSFULLY!")
    print("=" * 75)

if __name__ == "__main__":
    run_verification_tests()
