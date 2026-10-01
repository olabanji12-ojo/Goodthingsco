import ProductForm from '../../components/admin/ProductForm';
import { createProduct } from '../../services/productService';
import { CreateProductInput, UpdateProductInput } from '../../types/product';

export default function AdminProductNewPage() {
  const handleCreateProduct = async (data: CreateProductInput | UpdateProductInput) => {
    await createProduct(data as CreateProductInput);
  };

  return <ProductForm onSubmit={handleCreateProduct} isEdit={false} />;
}
