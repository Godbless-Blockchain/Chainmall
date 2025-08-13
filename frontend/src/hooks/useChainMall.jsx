import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { useTransaction } from '../context/TransactionContext';
 
// From the smart contract's OrderStatus enum.
// Moved outside the hook to become a stable constant, preventing unnecessary re-renders.
const orderStatusMap = [
  'Pending',
  'Shipped',
  'Completed',
  'Cancelled',
  'Disputed',
  'Resolved',
];

export function useChainMall() {
  const { contract } = useWallet();
  const { startTransaction, endTransaction, setError } = useTransaction();
  /**
   * Lists a new product on the marketplace.
   * @param {string} name - The name of the product.
   * @param {string} description - The product description.
   * @param {number} priceInEth - The price in ETH.
   * @param {string} category - The product category.
   * @param {string} imageHash - The IPFS hash of the product image.
   * @returns {boolean} - True if the transaction was successful, false otherwise.
   */
  const listProduct = useCallback(async (name, description, priceInEth, category, imageHash) => {
    if (!contract) {
      setError("Please connect your wallet.");
      return false;
    }
 
    try {
      startTransaction("Listing your product on the blockchain...");
      
      // Convert price from ETH string/number to Wei
      const priceInWei = ethers.parseEther(priceInEth.toString());

      const tx = await contract.listProduct(
        name,
        description,
        priceInWei,
        category,
        imageHash
      );

      await tx.wait(); // Wait for the transaction to be mined
      endTransaction("Product listed successfully!");
      return true;
    } catch (err) {
      console.error("Failed to list product:", err);
      setError(err.reason || "Failed to list product. See console for details.");
      return false;
    }
  }, [contract, startTransaction, endTransaction, setError]);

  /**
   * Fetches all products from the smart contract.
   * @returns {Array} - An array of product objects.
   */
  const getAllProducts = useCallback(async () => {
    if (!contract) return [];
    try {
      const products = await contract.getAllProducts();
      // Format the data from the contract to be more UI-friendly
      return products
        .filter(p => p.isActive && p.seller !== ethers.ZeroAddress)
        .map(product => ({
          id: Number(product.id),
          name: product.name,
          description: product.description,
          price: ethers.formatEther(product.price), // Convert from Wei to ETH string
          seller: product.seller,
          category: product.category,
          imageHash: product.imageHash,
          isActive: product.isActive,
          createdAt: Number(product.createdAt),
        }));
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Could not fetch products from the network.");
      return [];
    }
  }, [contract, setError]);

  /**
   * Fetches a single product from the smart contract.
   * @param {number} productId - The ID of the product to fetch.
   * @returns {object | null} - A product object or null if not found.
   */
  const getProduct = useCallback(async (productId) => {
    if (!contract) return null;
    try {
      const product = await contract.getProduct(productId);
      // Ensure we don't return empty/inactive products
      if (product.seller === ethers.ZeroAddress || !product.isActive) {
        return null;
      }
      return {
        id: Number(product.id),
        name: product.name,
        description: product.description,
        price: ethers.formatEther(product.price),
        seller: product.seller,
        category: product.category,
        imageHash: product.imageHash,
        isActive: product.isActive,
        createdAt: Number(product.createdAt),
      };
    } catch (err) {
      console.error(`Failed to fetch product ${productId}:`, err);
      return null;
    }
  }, [contract]);

  /**
   * Fetches a single order from the smart contract.
   * @param {number} orderId - The ID of the order to fetch.
   * @returns {object | null} - An order object or null if not found.
   */
  const getOrder = useCallback(async (orderId) => {
    if (!contract) return null;
    try {
      // The public getter for the 'orders' mapping in the contract.
      const orderData = await contract.orders(orderId);
      if (orderData.buyer === ethers.ZeroAddress) {
        return null; // Order doesn't exist if buyer is zero address
      }

      // The Order struct in the contract doesn't have seller, so we fetch the product.
      const product = await getProduct(Number(orderData.productId));
      if (!product) {
        console.error(`Product for order ${orderId} not found.`);
        return null;
      }

      return {
        id: Number(orderData.id),
        productId: Number(orderData.productId),
        buyer: orderData.buyer,
        seller: product.seller, // Enrich with seller from product
        status: orderStatusMap[Number(orderData.status)] || 'Unknown',
        createdAt: new Date(Number(orderData.createdAt) * 1000),
        updatedAt: new Date(Number(orderData.updatedAt) * 1000),
        buyerMessage: orderData.buyerMessage,
      };
    } catch (err) {
      console.error(`Failed to fetch order ${orderId}:`, err);
      return null;
    }
  }, [contract, getProduct, orderStatusMap]);
  
  /**
   * Fetches all sales for the connected seller.
   * @returns {Array} - An array of order objects.
   */
  const getMySales = useCallback(async () => {
    if (!contract) return [];
    try {
      const sales = await contract.getMySales();
      return sales.map(order => ({
        id: Number(order.id),
        productId: Number(order.productId),
        buyer: order.buyer,
        status: orderStatusMap[Number(order.status)] || 'Unknown',
        createdAt: new Date(Number(order.createdAt) * 1000),
        buyerMessage: order.buyerMessage,
      }));
    } catch (err) {
      console.error("Failed to fetch sales:", err);
      setError("Could not fetch your sales data.");
      return [];
    }
  }, [contract, setError, orderStatusMap]);

  /**
   * Fetches all orders for the connected buyer.
   * @returns {Array} - An array of order objects.
   */
  const getMyOrders = useCallback(async () => {
    if (!contract) return [];
    try {
      const orders = await contract.getMyOrders();
      return orders.map(order => ({
        id: Number(order.id),
        productId: Number(order.productId),
        status: orderStatusMap[Number(order.status)] || 'Unknown',
        createdAt: new Date(Number(order.createdAt) * 1000),
        buyerMessage: order.buyerMessage,
      }));
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Could not fetch your order data.");
      return [];
    }
  }, [contract, setError, orderStatusMap]);

  /**
   * Allows a seller to mark an order as shipped.
   * @param {number} orderId - The ID of the order to mark as shipped.
   * @returns {boolean} - True if the transaction was successful, false otherwise.
   */
  const markAsShipped = useCallback(async (orderId) => {
    if (!contract) {
      setError("Please connect your wallet.");
      return false;
    }

    try {
      startTransaction("Marking order as shipped...");

      const tx = await contract.markAsShipped(orderId);
      await tx.wait();

      endTransaction("Order marked as shipped successfully!");
      return true;
    } catch (err) {
      console.error("Failed to mark as shipped:", err);
      setError(err.reason || "Failed to mark order as shipped.");
      return false;
    }
  }, [contract, startTransaction, endTransaction, setError]);

  /**
   * Allows a buyer to mark an order as completed and release funds.
   * @param {number} orderId - The ID of the order to complete.
   * @returns {boolean} - True if the transaction was successful, false otherwise.
   */
  const markAsCompleted = useCallback(async (orderId) => {
    if (!contract) {
      setError("Please connect your wallet.");
      return false;
    }

    try {
      startTransaction("Confirming receipt of your order...");
      const tx = await contract.markAsCompleted(orderId);
      await tx.wait();
      endTransaction("Order completed successfully! Funds released to the seller.");
      return true;
    } catch (err) {
      console.error("Failed to mark as completed:", err);
      setError(err.reason || "Failed to confirm receipt.");
      return false;
    }
  }, [contract, startTransaction, endTransaction, setError]);

  /**
   * Allows a user to raise a dispute on an order.
   * @param {number} orderId - The ID of the order to dispute.
   * @param {string} reason - The reason for the dispute.
   * @returns {boolean} - True if the transaction was successful, false otherwise.
   */
  const raiseDispute = useCallback(async (orderId, reason) => {
    if (!contract) {
      setError("Please connect your wallet.");
      return false;
    }

    try {
      startTransaction("Raising a dispute on the blockchain...");
      const tx = await contract.raiseDispute(orderId, reason);
      await tx.wait();
      endTransaction("Dispute raised successfully.");
      return true;
    } catch (err) {
      console.error("Failed to raise dispute:", err);
      setError(err.reason || "Failed to raise dispute.");
      return false;
    }
  }, [contract, startTransaction, endTransaction, setError]);

  /**
   * Purchases a product from the marketplace.
   * @param {number} productId - The ID of the product to purchase.
   * @param {string} priceInEth - The price of the product in ETH (as a string).
   * @param {string} buyerMessage - A message from the buyer.
   * @returns {boolean} - True if the transaction was successful, false otherwise.
   */
  const purchaseProduct = useCallback(async (productId, priceInEth, buyerMessage) => {
    if (!contract) {
      setError("Please connect your wallet to purchase a product.");
      return false;
    }

    try {
      startTransaction("Processing your purchase on the blockchain...");

      const priceInWei = ethers.parseEther(priceInEth);

      const tx = await contract.purchaseProduct(productId, buyerMessage, {
        value: priceInWei,
      });

      await tx.wait(); // Wait for the transaction to be mined
      endTransaction("Product purchased successfully!");
      return true;
    } catch (err) {
      console.error("Failed to purchase product:", err);
      setError(err.reason || "Failed to purchase product. See console for details.");
      return false;
    }
  }, [contract, startTransaction, endTransaction, setError]);

  /**
   * Allows the contract admin to resolve a dispute.
   * @param {number} orderId - The ID of the order to resolve.
   * @param {boolean} refundBuyer - True to refund the buyer, false to pay the seller.
   * @param {string} resolutionNote - A note from the admin explaining the decision.
   * @returns {boolean} - True if the transaction was successful, false otherwise.
   */
  const resolveDispute = useCallback(async (orderId, refundBuyer, resolutionNote) => {
    if (!contract) {
      setError("Please connect your wallet.");
      return false;
    }

    try {
      startTransaction("Resolving dispute on the blockchain...");
      const tx = await contract.resolveDispute(orderId, refundBuyer, resolutionNote);
      await tx.wait();
      endTransaction("Dispute resolved successfully.");
      return true;
    } catch (err) {
      console.error("Failed to resolve dispute:", err);
      setError(err.reason || "Failed to resolve dispute.");
      return false;
    }
  }, [contract, startTransaction, endTransaction, setError]);

  /**
   * Fetches ALL orders from the contract. Note: this is inefficient for large numbers of orders.
   * @returns {Array} - An array of all order objects.
   */
  const getAllOrders = useCallback(async () => {
    if (!contract) return [];
    try {
      const orderCount = await contract.nextOrderId();
      const orders = [];
      for (let i = 0; i < orderCount; i++) {
        const order = await getOrder(i);
        if (order) orders.push(order);
      }
      return orders;
    } catch (err) {
      console.error("Failed to fetch all orders:", err);
      setError("Could not fetch all orders from the network.");
      return [];
    }
  }, [contract, getOrder, setError]);

  /**
   * Fetches the admin address from the smart contract.
   * @returns {string | null} - The admin address or null if not found.
   */
  const getAdminAddress = useCallback(async () => {
    if (!contract) return null;
    try {
      return await contract.admin();
    } catch (err) {
      console.error("Failed to fetch admin address:", err);
      setError("Could not fetch admin address.");
      return null;
    }
  }, [contract, setError]);

  return { 
    listProduct, 
    getAllProducts, 
    getProduct, 
    getOrder, 
    purchaseProduct, 
    getMySales, 
    getMyOrders, 
    markAsShipped, 
    markAsCompleted, 
    raiseDispute, 
    resolveDispute, 
    getAllOrders,
    getAdminAddress,
  };
}