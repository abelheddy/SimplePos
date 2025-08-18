import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesAPI, nodeAPI } from '../../../services/api';
import Select from 'react-select';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiArrowLeft, FiCheck, FiSearch, FiX, FiShoppingBag } from 'react-icons/fi';

const NewSalePage = () => {
    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const navigate = useNavigate();
    const cartRef = useRef(null);

    // Cargar productos
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await nodeAPI.getProducts();
                setProducts(response.data);
                setFilteredProducts(response.data);
            } catch (err) {
                setError('Error al cargar productos');
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Filtrar productos
    useEffect(() => {
        let result = products;
        
        if (searchTerm) {
            result = result.filter(product => 
                product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (selectedCategory !== 'all') {
            result = result.filter(product => 
                product.id_marca.toString() === selectedCategory
            );
        }
        
        setFilteredProducts(result);
    }, [searchTerm, selectedCategory, products]);

    // Obtener categorías únicas
    const getCategories = () => {
        const categoriesMap = new Map();
        products.forEach(product => {
            if (product.id_marca && product.marca_nombre) {
                categoriesMap.set(product.id_marca, product.marca_nombre);
            }
        });
        return Array.from(categoriesMap, ([id, name]) => ({ id, name }));
    };

    const addToCart = (product, quantity) => {
        const quantityNum = Number(quantity) || 0;
        if (quantityNum <= 0) return;

        // Verificar stock
        if (quantityNum > (product.stock || 0)) {
            setError(`Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}`);
            return;
        }

        const unitPrice = Number(product.precio_venta) || 0;
        const existingItem = cart.find(item => item.productId === product.id_producto);

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantityNum;
            if (newQuantity > product.stock) {
                setError(`No hay suficiente stock de ${product.nombre}. Disponible: ${product.stock}`);
                return;
            }
            setCart(cart.map(item =>
                item.productId === product.id_producto
                    ? {
                        ...item,
                        quantity: newQuantity,
                        subtotal: newQuantity * unitPrice
                    }
                    : item
            ));
        } else {
            setCart([...cart, {
                productId: product.id_producto,
                productName: product.nombre,
                quantity: quantityNum,
                unitPrice: unitPrice,
                subtotal: quantityNum * unitPrice,
                stock: product.stock,
                image: product.imagen || 'default-product.jpg'
            }]);
        }
        setError('');
        
        // Animación de scroll al carrito
        setTimeout(() => {
            if (cartRef.current) {
                cartRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }, 300);
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        const quantityNum = Number(newQuantity) || 0;
        const item = cart.find(item => item.productId === productId);
        if (!item) return;

        // Verificar stock máximo
        if (quantityNum > item.stock) {
            setError(`No puedes agregar más de ${item.stock} unidades de ${item.productName}`);
            return;
        }

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
        setError('');
    };

    const incrementQuantity = (productId) => {
        const item = cart.find(item => item.productId === productId);
        if (item) {
            const newQuantity = item.quantity + 1;
            if (newQuantity > item.stock) {
                setError(`No hay suficiente stock de ${item.productName}. Disponible: ${item.stock}`);
                return;
            }
            updateQuantity(productId, newQuantity);
        }
    };

    const decrementQuantity = (productId) => {
        const item = cart.find(item => item.productId === productId);
        if (item) {
            const newQuantity = item.quantity - 1;
            updateQuantity(productId, newQuantity);
        }
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => {
            const subtotal = Number(item.subtotal) || 0;
            return total + subtotal;
        }, 0);
    };

    const calculateItemsCount = () => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    };

    const handleSubmit = async () => {
        if (cart.length === 0) {
            setError('Debe agregar al menos un producto');
            return;
        }

        try {
            const saleData = {
                items: cart.map(item => ({
                    productId: item.productId.toString(),
                    productName: item.productName,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice)
                }))
            };

            // Registrar venta en MongoDB
            await salesAPI.create(saleData);

            // Actualizar stock en PostgreSQL para cada producto
            const updatePromises = cart.map(item => 
                nodeAPI.inventory.decrement(item.productId, item.quantity)
            );

            await Promise.all(updatePromises);

            setSuccess(true);
            setTimeout(() => {
                navigate('/vendedor/sales');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error al registrar la venta');
            console.error('Error detallado:', {
                message: err.message,
                response: err.response?.data,
                stack: err.stack
            });
        }
    };

    const clearCart = () => {
        setCart([]);
        setError('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => navigate('/vendedor/sales')}
                        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        <FiArrowLeft className="mr-2" /> Volver a Ventas
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <FiShoppingBag className="mr-3 text-blue-500" />
                        Nueva Venta
                    </h1>
                    <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                        Artículos: {calculateItemsCount()}
                    </div>
                </div>

                {/* Mensajes de estado */}
                <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded"
                            role="alert"
                        >
                            <p className="flex items-center">
                                <FiX className="mr-2 cursor-pointer" onClick={() => setError('')} />
                                {error}
                            </p>
                        </motion.div>
                    )}
                    
                    {success && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded"
                            role="alert"
                        >
                            <p className="flex items-center">
                                <FiCheck className="mr-2" />
                                ¡Venta registrada correctamente! Redirigiendo...
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Panel izquierdo: Productos */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <FiSearch className="mr-2 text-blue-500" />
                                Buscar Productos
                            </h2>
                            
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o descripción..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
                                </div>
                                
                                <div className="w-full md:w-64">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    >
                                        <option value="all">Todas las categorías</option>
                                        {getCategories().map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {filteredProducts.map(product => (
                                    <ProductCard 
                                        key={product.id_producto} 
                                        product={product} 
                                        onAdd={addToCart} 
                                    />
                                ))}
                                
                                {filteredProducts.length === 0 && (
                                    <div className="col-span-full text-center py-10">
                                        <FiX className="mx-auto text-4xl text-gray-400 mb-3" />
                                        <p className="text-gray-500">No se encontraron productos</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Panel derecho: Carrito */}
                    <div className="bg-white rounded-xl shadow-lg p-6" ref={cartRef}>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <FiShoppingCart className="mr-2 text-blue-500" />
                            Resumen de Venta
                        </h2>
                        
                        {cart.length === 0 ? (
                            <div className="text-center py-10">
                                <FiShoppingCart className="mx-auto text-4xl text-gray-300 mb-4" />
                                <p className="text-gray-500">No hay productos en el carrito</p>
                                <p className="text-gray-400 text-sm mt-2">Agrega productos desde el panel izquierdo</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map(item => (
                                    <CartItem 
                                        key={item.productId}
                                        item={item}
                                        onIncrement={incrementQuantity}
                                        onDecrement={decrementQuantity}
                                        onRemove={removeFromCart}
                                    />
                                ))}
                                
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <div className="flex justify-between text-lg font-medium mb-2">
                                        <span>Subtotal:</span>
                                        <span>${calculateTotal().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 mb-2">
                                        <span>Impuestos (12%):</span>
                                        <span>${(calculateTotal() * 0.12).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t border-gray-200">
                                        <span>Total:</span>
                                        <span>${(calculateTotal() * 1.12).toFixed(2)}</span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-3 mt-6">
                                    <button
                                        onClick={clearCart}
                                        className="px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
                                    >
                                        <FiTrash2 className="mr-2" /> Vaciar Carrito
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                                    >
                                        <FiCheck className="mr-2" /> Finalizar Venta (${(calculateTotal() * 1.12).toFixed(2)})
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente Tarjeta de Producto
const ProductCard = ({ product, onAdd }) => {
    const [quantity, setQuantity] = useState(1);
    
    return (
        <motion.div 
            className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            whileHover={{ y: -5 }}
        >
            <div className="bg-gray-100 h-40 flex items-center justify-center">
                {product.imagen ? (
                    <img 
                        src={product.imagen} 
                        alt={product.nombre} 
                        className="object-contain h-full w-full"
                    />
                ) : (
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                )}
            </div>
            
            <div className="p-4">
                <h3 className="font-semibold text-gray-800 truncate">{product.nombre}</h3>
                <p className="text-sm text-gray-600 truncate mb-2">{product.descripcion}</p>
                
                <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-blue-600">
                        ${Number(product.precio_venta).toFixed(2)}
                    </span>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                        product.stock > 10 ? 'bg-green-100 text-green-800' : 
                        product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                    }`}>
                        Stock: {product.stock}
                    </span>
                </div>
                
                <div className="flex gap-2">
                    <input
                        type="number"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-center"
                    />
                    <button
                        onClick={() => onAdd(product, quantity)}
                        className="px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <FiPlus />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// Componente Item del Carrito
const CartItem = ({ item, onIncrement, onDecrement, onRemove }) => {
    return (
        <motion.div 
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
        >
            <div className="flex items-center">
                <div className="bg-gray-100 w-16 h-16 rounded-lg flex items-center justify-center mr-3">
                    {item.image ? (
                        <img 
                            src={item.image} 
                            alt={item.productName} 
                            className="object-contain h-12 w-12"
                        />
                    ) : (
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                    )}
                </div>
                <div>
                    <h4 className="font-medium text-gray-800">{item.productName}</h4>
                    <p className="text-sm text-gray-600">${item.unitPrice.toFixed(2)} c/u</p>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-300 rounded-lg">
                    <button 
                        onClick={() => onDecrement(item.productId)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                        disabled={item.quantity <= 1}
                    >
                        <FiMinus />
                    </button>
                    
                    <span className="px-3 py-1">{item.quantity}</span>
                    
                    <button 
                        onClick={() => onIncrement(item.productId)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                        disabled={item.quantity >= item.stock}
                    >
                        <FiPlus />
                    </button>
                </div>
                
                <span className="font-medium w-20 text-right">
                    ${item.subtotal.toFixed(2)}
                </span>
                
                <button
                    onClick={() => onRemove(item.productId)}
                    className="p-2 text-red-500 hover:text-red-700"
                >
                    <FiTrash2 />
                </button>
            </div>
        </motion.div>
    );
};

export default NewSalePage;