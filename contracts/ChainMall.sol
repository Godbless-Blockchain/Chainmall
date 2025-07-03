// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ChainMall {
    enum ProductState {
        Created,
        Paid,
        Delivered,
        Disputed,
        Resolved
    }

    struct Product {
        uint256 id;
        string name;
        uint256 price;
        address payable seller;
        address payable buyer;
        bool isNew;
        string category;
        string subcategory;
        string description;
        string imageHash;
        ProductState state;
        uint256 createdAt;
        uint256 paidAt;
        uint256 deliveredAt;
        string buyerMessage;
        string adminMessage;
    }

    uint256 public nextProductId;
    mapping(uint256 => Product) public products;

    address public admin;

    constructor() {
        admin = msg.sender;
    }

    modifier onlySeller(uint256 productId) {
        require(msg.sender == products[productId].seller, "Not seller");
        _;
    }

    modifier onlyBuyer(uint256 productId) {
        require(msg.sender == products[productId].buyer, "Not buyer");
        _;
    }

    modifier inState(uint256 productId, ProductState expected) {
        require(products[productId].state == expected, "Invalid state");
        _;
    }

    // List a new product
    function listProduct(
        string memory name,
        uint256 price,
        bool isNew,
        string memory category,
        string memory subcategory,
        string memory description,
        string memory imageHash
    ) external {
        products[nextProductId] = Product({
            id: nextProductId,
            name: name,
            price: price,
            seller: payable(msg.sender),
            buyer: payable(address(0)),
            isNew: isNew,
            category: category,
            subcategory: subcategory,
            description: description,
            imageHash: imageHash,
            state: ProductState.Created,
            createdAt: block.timestamp,
            paidAt: 0,
            deliveredAt: 0,
            buyerMessage: "",
            adminMessage: ""
        });

        nextProductId++;
    }

    // Buy a product (escrowed)
    function buyProduct(uint256 productId, string memory message) external payable inState(productId, ProductState.Created) {
        Product storage product = products[productId];
        require(msg.value == product.price, "Incorrect payment");

        product.buyer = payable(msg.sender);
        product.state = ProductState.Paid;
        product.paidAt = block.timestamp;
        product.buyerMessage = message;
    }

    // Mark product as delivered
    function markAsDelivered(uint256 productId) external onlyBuyer(productId) inState(productId, ProductState.Paid) {
        Product storage product = products[productId];
        product.state = ProductState.Delivered;
        product.deliveredAt = block.timestamp;
        product.seller.transfer(product.price); // release escrow
    }

    // Raise a dispute
    function raiseDispute(uint256 productId, string memory reason) external onlyBuyer(productId) inState(productId, ProductState.Paid) {
        Product storage product = products[productId];
        product.state = ProductState.Disputed;
        product.buyerMessage = reason;
    }

    // Admin resolves dispute
    function resolveDispute(uint256 productId, bool refundBuyer, string memory resolutionNote) external {
        require(msg.sender == admin, "Only admin");
        Product storage product = products[productId];
        require(product.state == ProductState.Disputed, "No dispute");

        product.state = ProductState.Resolved;
        product.adminMessage = resolutionNote;

        if (refundBuyer) {
            product.buyer.transfer(product.price);
        } else {
            product.seller.transfer(product.price);
        }
    }

    // Helper to get product info
    function getProduct(uint256 productId) external view returns (Product memory) {
        return products[productId];
    }
}
