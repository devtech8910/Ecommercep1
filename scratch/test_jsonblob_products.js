const CLOUD_PRODUCTS_URL = 'https://jsonblob.com/api/jsonBlob/019fc117-cf81-7c70-8559-16210c2b49ae';

async function test() {
  const getRes = await fetch(CLOUD_PRODUCTS_URL);
  const data = await getRes.json();
  console.log('Initial GET:', data);

  const sample = [
    {
      id: 'prod_test_123',
      pid: 'prod_test_123',
      title: 'Test Oversized Tee',
      brand: 'DevTech',
      category: "Men's Wear",
      price: 1299,
      mrp: 1999,
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518'
    }
  ];

  const putRes = await fetch(CLOUD_PRODUCTS_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sample)
  });
  console.log('PUT status:', putRes.status);

  const getRes2 = await fetch(CLOUD_PRODUCTS_URL);
  const data2 = await getRes2.json();
  console.log('Updated GET:', data2);
}

test().catch(console.error);
