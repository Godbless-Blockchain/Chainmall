const { expect } = require("chai");
const hre = require("hardhat");
const ethers = hre.ethers; // ✅ Fix: attach ethers safely

describe("ChainMall", function () {
  let chainMall;
  let admin, seller, buyer, other;
  let productPrice;

  beforeEach(async function () {
    [admin, seller, buyer, other] = await ethers.getSigners();

    const ChainMall = await ethers.getContractFactory("ChainMall", admin);
    chainMall = await ChainMall.deploy();

    productPrice = ethers.utils.parseEther("1.0");
  });

  it("should allow seller to list a product", async function () {
    await chainMall.connect(seller).listProduct(
      "Phone",
      productPrice,
      true,
      "Electronics",
      "Smartphones",
      "A new smartphone",
      "ipfs://image1"
    );

    const product = await chainMall.products(0);
    expect(product.name).to.equal("Phone");
    expect(product.price).to.equal(productPrice);
    expect(product.seller).to.equal(seller.address);
    expect(product.state).to.equal(0); // Created
  });

  it("should allow buyer to purchase a product", async function () {
    await chainMall.connect(seller).listProduct(
      "Tablet",
      productPrice,
      false,
      "Electronics",
      "Tablets",
      "A used tablet",
      "ipfs://image2"
    );

    await chainMall.connect(buyer).buyProduct(0, "Deliver to KNUST", {
      value: productPrice,
    });

    const product = await chainMall.products(0);
    expect(product.state).to.equal(1); // Paid
    expect(product.buyer).to.equal(buyer.address);
    expect(product.buyerMessage).to.equal("Deliver to KNUST");
  });

  it("should allow buyer to mark product as delivered and release funds", async function () {
    await chainMall.connect(seller).listProduct(
      "Watch",
      productPrice,
      false,
      "Fashion",
      "Accessories",
      "Classic watch",
      "ipfs://image3"
    );

    await chainMall.connect(buyer).buyProduct(0, "Wrap it nicely", {
      value: productPrice,
    });

    const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

    const tx = await chainMall.connect(buyer).markAsDelivered(0);
    const receipt = await tx.wait();

    const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);

    expect((await chainMall.products(0)).state).to.equal(2); // Delivered
    expect(sellerBalanceAfter.sub(sellerBalanceBefore)).to.be.closeTo(
      productPrice,
      ethers.utils.parseEther("0.01")
    );
  });

  it("should allow buyer to raise a dispute", async function () {
    await chainMall.connect(seller).listProduct(
      "Headphones",
      productPrice,
      false,
      "Electronics",
      "Audio",
      "Bluetooth headphones",
      "ipfs://image4"
    );

    await chainMall.connect(buyer).buyProduct(0, "Color must be black", {
      value: productPrice,
    });

    await chainMall.connect(buyer).raiseDispute(0, "Not black");

    const product = await chainMall.products(0);
    expect(product.state).to.equal(3); // Disputed
    expect(product.buyerMessage).to.equal("Not black");
  });

  it("should allow admin to resolve dispute with refund", async function () {
    await chainMall.connect(seller).listProduct(
      "Book",
      productPrice,
      false,
      "Education",
      "Textbooks",
      "Engineering book",
      "ipfs://image5"
    );

    await chainMall.connect(buyer).buyProduct(0, "Fast shipping", {
      value: productPrice,
    });

    await chainMall.connect(buyer).raiseDispute(0, "Pages missing");

    const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

    const tx = await chainMall.connect(admin).resolveDispute(0, true, "Refunded");
    await tx.wait();

    const product = await chainMall.products(0);
    expect(product.state).to.equal(4); // Resolved
    expect(product.adminMessage).to.equal("Refunded");
  });

  it("should allow admin to resolve dispute in favor of seller", async function () {
    await chainMall.connect(seller).listProduct(
      "Shoe",
      productPrice,
      true,
      "Fashion",
      "Footwear",
      "Leather shoe",
      "ipfs://image6"
    );

    await chainMall.connect(buyer).buyProduct(0, "Send by Friday", {
      value: productPrice,
    });

    await chainMall.connect(buyer).raiseDispute(0, "Wrong size");

    const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

    const tx = await chainMall.connect(admin).resolveDispute(0, false, "Buyer gave wrong size");
    await tx.wait();

    const product = await chainMall.products(0);
    const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);

    expect(product.state).to.equal(4); // Resolved
    expect(product.adminMessage).to.equal("Buyer gave wrong size");

    expect(sellerBalanceAfter.sub(sellerBalanceBefore)).to.be.closeTo(
      productPrice,
      ethers.utils.parseEther("0.01")
    );
  });
});
