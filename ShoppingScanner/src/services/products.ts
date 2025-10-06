// Mock product database - in a real app, this would be replaced with an API call
const mockProducts: Record<string, { name: string; price: number }> = {
  '5901234123457': { name: 'Example Product 1', price: 2.99 },
  '4007817327098': { name: 'Example Product 2', price: 1.49 },
  // Add more mock products as needed
};

export const lookupProduct = async (barcode: string) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const product = mockProducts[barcode];
  if (!product) {
    throw new Error('Product not found');
  }

  return product;
};

// In a real app, you would implement an actual API call:
/*
export const lookupProduct = async (barcode: string) => {
  try {
    const response = await fetch(`https://api.example.com/products/${barcode}`);
    if (!response.ok) {
      throw new Error('Product not found');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};
*/