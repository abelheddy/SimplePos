import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesAPI, nodeAPI } from '../../../services/api';
import Select from 'react-select';

const NewSalePage = () => {
    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Cargar productos
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await nodeAPI.getProducts();
                setProducts(response.data);
            } catch (err) {
                setError('Error al cargar productos');
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const addToCart = (product, quantity) => {
        const quantityNum = Number(quantity) || 0;
        if (quantityNum <= 0) return;

        const unitPrice = Number(product.precio_venta) || 0;
        const existingItem = cart.find(item => item.productId === product.id_producto);

        if (existingItem) {
            setCart(cart.map(item =>
                item.productId === product.id_producto
                    ? {
                        ...item,
                        quantity: item.quantity + quantityNum,
                        subtotal: (item.quantity + quantityNum) * unitPrice
                    }
                    : item
            ));
        } else {
            setCart([...cart, {
                productId: product.id_producto,
                productName: product.nombre,
                quantity: quantityNum,
                unitPrice: unitPrice,
                subtotal: quantityNum * unitPrice
            }]);
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        const quantityNum = Number(newQuantity) || 0;
        if (quantityNum <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart(cart.map(item =>
            item.productId === productId
                ? {
                    ...item,
                    quantity: quantityNum,
                    subtotal: quantityNum * (Number(item.unitPrice) || 0)
                }
                : item
        ));
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => {
            const subtotal = Number(item.subtotal) || 0;
            return total + subtotal;
        }, 0);
    };

    const handleSubmit = async () => {
        if (cart.length === 0) {
            setError('Debe agregar al menos un producto');
            return;
        }

        try {
            const saleData = {
                items: cart.map(item => ({
                    productId: item.productId.toString(), // Asegurar que es string
                    productName: item.productName.trim(), // Limpiar espacios
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice)
                }))
            };

            console.log('Datos a enviar (JSON):', JSON.stringify(saleData, null, 2));

            await salesAPI.create(saleData);
            navigate('/vendedor/sales');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al registrar la venta');
            console.error('Error detallado:', {
                message: err.message,
                response: err.response?.data,
                stack: err.stack
            });
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Nueva Venta</h1>

            {/* Selector de productos */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-xl font-semibold mb-3">Agregar Productos</h2>
                {loading ? (
                    <p>Cargando productos...</p>
                ) : (
                    <ProductSelector
                        products={products}
                        onAdd={addToCart}
                    />
                )}
            </div>

            {/* Carrito de compras */}
            <div className="mb-6 p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-3">Resumen de Venta</h2>
                {cart.length === 0 ? (
                    <p className="text-gray-500">No hay productos en el carrito</p>
                ) : (
                    <CartItems
                        items={cart}
                        onUpdate={updateQuantity}
                        onRemove={removeFromCart}
                    />
                )}

                <div className="mt-4 pt-4 border-t">
                    <p className="text-lg font-semibold">
                        Total: ${calculateTotal().toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3">
                <button
                    onClick={() => navigate('/vendedor/sales')}
                    className="px-4 py-2 bg-gray-300 rounded"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={cart.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                    Finalizar Venta
                </button>
            </div>
        </div>
    );
};

// Componente ProductSelector (sin cambios)
const ProductSelector = ({ products, onAdd }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);

    const options = products.map(p => ({
        value: p,
        label: `${p.nombre} - $${Number(p.precio_venta).toFixed(2)} (Stock: ${p.stock || 0})`
    }));

    const handleAdd = () => {
        if (selectedProduct) {
            onAdd(selectedProduct.value, quantity);
            setQuantity(1);
            setSelectedProduct(null);
        }
    };

    return (
        <div className="flex items-end gap-3">
            <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Producto</label>
                <Select
                    options={options}
                    onChange={setSelectedProduct}
                    value={selectedProduct}
                    placeholder="Seleccionar producto..."
                />
            </div>
            <div className="w-24">
                <label className="block text-sm font-medium mb-1">Cantidad</label>
                <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2 border rounded"
                />
            </div>
            <button
                onClick={handleAdd}
                disabled={!selectedProduct}
                className="px-3 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
                Agregar
            </button>
        </div>
    );
};

// Componente CartItems corregido
const CartItems = ({ items, onUpdate, onRemove }) => (
    <div className="divide-y">
        {items.map(item => {
            // Aseguramos que los valores sean números
            const unitPrice = Number(item.unitPrice) || 0;
            const quantity = Number(item.quantity) || 0;
            const subtotal = Number(item.subtotal) || (unitPrice * quantity);

            return (
                <div key={item.productId} className="py-3 flex justify-between items-center">
                    <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">${unitPrice.toFixed(2)} c/u</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => onUpdate(item.productId, parseInt(e.target.value) || 1)}
                            className="w-20 p-1 border rounded text-center"
                        />

                        <p className="w-24 text-right font-medium">
                            ${subtotal.toFixed(2)}
                        </p>

                        <button
                            onClick={() => onRemove(item.productId)}
                            className="p-1 text-red-500 hover:text-red-700"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            );
        })}
    </div>
);

export default NewSalePage;