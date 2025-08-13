// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ChainMall {
    enum OrderStatus { Pending, Shipped, Completed, Cancelled, Disputed, Resolved }

    struct Product {
        uint256 id;
        string name;
        string description;
        uint256 price; // in wei (GHS equivalent, handled in frontend)
        address payable seller;
        string category;
        string imageHash;
        bool isActive;
        uint256 createdAt;
    }

    struct Order {
        uint256 id;
        uint256 productId;
        address payable buyer;
        OrderStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        string buyerMessage;
        string adminMessage;
    }

    address public admin;
    uint256 public nextProductId;
    uint256 public nextOrderId;

    mapping(uint256 => Product) public products;
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public sellerProducts;
    mapping(address => uint256[]) public buyerOrders;

    event ProductListed(
        uint256 indexed productId,
        address indexed seller,
        string name,
        uint256 price,
        string category,
        string imageHash
    );
    event ProductPurchased(
        uint256 indexed orderId,
        uint256 indexed productId,
        address indexed buyer
    );
    event OrderStatusChanged(
        uint256 indexed orderId,
        OrderStatus status
    );
    event ProductDeactivated(uint256 indexed productId);

    modifier onlySeller(uint256 productId) {
        require(msg.sender == products[productId].seller, "Not seller");
        _;
    }

    modifier onlyBuyer(uint256 orderId) {
        require(msg.sender == orders[orderId].buyer, "Not buyer");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // List a new product
    function listProduct(
        string memory name,
        string memory description,
        uint256 price,
        string memory category,
        string memory imageHash
    ) external {
        require(price > 0, "Price must be greater than 0");
        uint256 productId = nextProductId++;
        products[productId] = Product({
            id: productId,
            name: name,
            description: description,
            price: price,
            seller: payable(msg.sender),
            category: category,
            imageHash: imageHash,
            isActive: true,
            createdAt: block.timestamp
        });
        sellerProducts[msg.sender].push(productId);
        emit ProductListed(productId, msg.sender, name, price, category, imageHash);
    }

    // Deactivate a product (seller)
    function deactivateProduct(uint256 productId) external onlySeller(productId) {
        products[productId].isActive = false;
        emit ProductDeactivated(productId);
    }

    // Purchase a product (escrowed)
    function purchaseProduct(uint256 productId, string memory buyerMessage) external payable {
        Product storage product = products[productId];
        require(product.isActive, "Product not available");
        require(msg.value == product.price, "Incorrect payment");
        require(product.seller != msg.sender, "Seller cannot buy own product");

        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            id: orderId,
            productId: productId,
            buyer: payable(msg.sender),
            status: OrderStatus.Pending,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            buyerMessage: buyerMessage,
            adminMessage: ""
        });
        buyerOrders[msg.sender].push(orderId);

        emit ProductPurchased(orderId, productId, msg.sender);
    }

    // Seller marks order as shipped
    function markAsShipped(uint256 orderId) external {
        Order storage order = orders[orderId];
        Product storage product = products[order.productId];
        require(msg.sender == product.seller, "Only seller can mark as shipped");
        require(order.status == OrderStatus.Pending, "Order not pending");
        order.status = OrderStatus.Shipped;
        order.updatedAt = block.timestamp;
        emit OrderStatusChanged(orderId, OrderStatus.Shipped);
    }

    // Buyer marks order as completed (releases funds)
    function markAsCompleted(uint256 orderId) external onlyBuyer(orderId) {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Shipped, "Order not shipped");
        order.status = OrderStatus.Completed;
        order.updatedAt = block.timestamp;
        // Release funds to seller
        products[order.productId].seller.transfer(products[order.productId].price);
        emit OrderStatusChanged(orderId, OrderStatus.Completed);
    }

    // Buyer can cancel order before shipping
    function cancelOrder(uint256 orderId) external onlyBuyer(orderId) {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Pending, "Cannot cancel after shipping");
        order.status = OrderStatus.Cancelled;
        order.updatedAt = block.timestamp;
        // Refund buyer
        order.buyer.transfer(products[order.productId].price);
        emit OrderStatusChanged(orderId, OrderStatus.Cancelled);
    }

    // Buyer raises a dispute
    function raiseDispute(uint256 orderId, string memory reason) external onlyBuyer(orderId) {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Shipped, "Can only dispute shipped orders");
        order.status = OrderStatus.Disputed;
        order.updatedAt = block.timestamp;
        order.buyerMessage = reason;
        emit OrderStatusChanged(orderId, OrderStatus.Disputed);
    }

    // Admin resolves dispute
    function resolveDispute(uint256 orderId, bool refundBuyer, string memory resolutionNote) external onlyAdmin {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Disputed, "No dispute");
        order.status = OrderStatus.Resolved;
        order.updatedAt = block.timestamp;
        order.adminMessage = resolutionNote;
        uint256 amount = products[order.productId].price;
        if (refundBuyer) {
            order.buyer.transfer(amount);
        } else {
            products[order.productId].seller.transfer(amount);
        }
        emit OrderStatusChanged(orderId, OrderStatus.Resolved);
    }

    // Get all products
    function getAllProducts() external view returns (Product[] memory) {
        Product[] memory all = new Product[](nextProductId);
        for (uint256 i = 0; i < nextProductId; i++) {
            all[i] = products[i];
        }
        return all;
    }

    // Get all orders for a buyer
    function getMyOrders() external view returns (Order[] memory) {
        uint256[] storage ids = buyerOrders[msg.sender];
        Order[] memory myOrders = new Order[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            myOrders[i] = orders[ids[i]];
        }
        return myOrders;
    }

    // Get all sales for a seller
    function getMySales() external view returns (Order[] memory) {
        uint256 count;
        for (uint256 i = 0; i < nextOrderId; i++) {
            if (products[orders[i].productId].seller == msg.sender) {
                count++;
            }
        }
        Order[] memory sales = new Order[](count);
        uint256 idx;
        for (uint256 i = 0; i < nextOrderId; i++) {
            if (products[orders[i].productId].seller == msg.sender) {
                sales[idx++] = orders[i];
            }
        }
        return sales;
    }

    // Get product info
    function getProduct(uint256 productId) external view returns (Product memory) {
        return products[productId];
    }
}
