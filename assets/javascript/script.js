// ============================================================================
// CART DATA STRUCTURE
// ============================================================================
// Cart object stores items using product name as key
// Format: { "PRODUCT_NAME": { count: number, price: number } }
let cart = {};

// ============================================================================
// DOM ELEMENT REFERENCES
// ============================================================================
// Cart-related elements
const cartCountElement = document.getElementById("cartCount");
const cartIcon = document.getElementById("cartIcon");
const cartDropdown = document.getElementById("cartDropdown");
const cartItemsList = document.getElementById("cartItemsList");
const proceedButton = document.getElementById("proceedButton");
const checkoutModal = document.getElementById("checkoutModal");
const checkoutForm = document.getElementById("checkoutForm");
const cancelCheckout = document.getElementById("cancelCheckout");
const successMessage = document.getElementById("successMessage");

// ============================================================================
// FEATURED PRODUCTS STICKY SCROLL SYSTEM
// ============================================================================
/*
  This creates a split-screen effect where:
  - Left side (40%): Shows "LATEST DROPS" heading - stays fixed
  - Right side (60%): Shows products - scrolls synchronously with page scroll
  
  Technical Implementation:
  1. Section height is dynamically calculated based on product content
  2. Container uses position:sticky to stick below header when reached
  3. As user scrolls the page, JavaScript updates the right side's scrollTop
  4. This creates illusion of scrolling through products while left stays static
  5. Section "unsticks" after all products are viewed
*/

const featuredProducts = document.getElementById("featuredProducts");
const featuredRight = document.getElementById("featuredRight");

if (featuredProducts && featuredRight) {
  /**
   * Calculates and sets the section height based on product content
   * Height = content height + viewport height (so there's enough scroll space)
   */
  const setFeaturedHeight = () => {
    const productScrollContainer = featuredRight.querySelector('.product-scroll-container');
    if (productScrollContainer) {
      // Get the full height of all products combined
      const contentHeight = productScrollContainer.scrollHeight;
      // Get viewport height minus header (78px)
      const viewportHeight = window.innerHeight - 78;
      // Set section min-height to create enough scroll distance for all products
      featuredProducts.style.minHeight = (contentHeight + viewportHeight) + 'px';
    }
  };
  
  /**
   * Synchronizes the right side scroll position with page scroll
   * Maps page scroll distance into the section to product scroll position
   */
  const syncRightScroll = () => {
    const productsSectionRect = featuredProducts.getBoundingClientRect();
    const headerHeight = 78;
    
    // Check if section has reached the sticky position (top of section is at header)
    if (productsSectionRect.top <= headerHeight) {
      // Calculate how far we've scrolled INTO the section (negative top value)
      const scrolledIntoSection = Math.abs(productsSectionRect.top - headerHeight);
      // Apply that same scroll distance to the product container
      featuredRight.scrollTop = scrolledIntoSection;
    } else {
      // Before reaching the section, keep products at top
      featuredRight.scrollTop = 0;
    }
  };
  
  // Initialize: Set height on page load
  setFeaturedHeight();
  
  // Update product scroll position on every page scroll
  window.addEventListener("scroll", syncRightScroll);
  
  // Recalculate height and sync scroll on window resize (responsive)
  window.addEventListener("resize", () => {
    setFeaturedHeight();
    syncRightScroll();
  });
}

// ============================================================================
// CART MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Updates the cart count badge in the header
 * Also manages proceed button state and hides success messages
 */
function updateCartCount() {
  if (!cartCountElement) return; // Guard: Exit if not on a page with cart

  // Calculate total number of items across all products
  const totalCount = Object.values(cart).reduce(
    (sum, item) => sum + item.count,
    0
  );
  cartCountElement.textContent = totalCount;

  // Disable proceed button if cart is empty
  if (proceedButton) {
    proceedButton.disabled = totalCount === 0;
  }

  // Hide success message when cart changes
  if (successMessage) {
    successMessage.style.display = "none";
  }
}

/**
 * Renders the cart items in the dropdown menu
 * Shows each item with quantity, price, and delete button
 */
function renderCartDropdown() {
  if (!cartItemsList) return; // Guard: Exit if not on a page with cart dropdown

  // Clear existing content
  cartItemsList.innerHTML = "";

  const cartItemsArray = Object.keys(cart);

  // Show empty message if no items
  if (cartItemsArray.length === 0) {
    cartItemsList.innerHTML =
      '<p class="empty-message">Your cart is empty.</p>';
    return;
  }

  // Create a cart item element for each product
  cartItemsArray.forEach((itemName) => {
    const item = cart[itemName];
    const itemElement = document.createElement("div");
    itemElement.classList.add("cart-item");

    // Build HTML: Product name x quantity, total price, delete button
    itemElement.innerHTML = `
            <div class="cart-item-info">
                <span class="cart-item-name">${itemName} x ${item.count}</span>
                <span class="cart-item-price">$${(
                  item.count * item.price
                ).toFixed(2)}</span>
            </div>
            <button class="cart-item-delete" data-item="${itemName}" aria-label="Remove ${itemName} from cart">✕</button>
        `;
    cartItemsList.appendChild(itemElement);
  });
}

/**
 * Removes an item completely from the cart
 * Updates localStorage and refreshes UI
 */
function removeItemFromCart(itemName) {
  delete cart[itemName];
  localStorage.setItem("ritchiesCart", JSON.stringify(cart));
  updateCartCount();
  renderCartDropdown();
  renderCheckoutPage(); // Update checkout page if on it
}

/**
 * Adds a product to the cart when "ADD TO CART" button is clicked
 * Extracts product info from the product card and updates cart
 */
function addItemToCart(event) {
  const button = event.target;
  if (button.classList.contains("add-to-cart")) {
    // Prevent event bubbling to parent elements
    event.stopPropagation();

    // Find the parent product card element
    const card = button.closest(".product-card");
    if (!card) return;

    // Extract product details from the card
    const name = card.querySelector("h3").textContent.trim();
    const priceText = card
      .querySelector(".price")
      .textContent.replace("$", "")
      .trim();
    const price = parseFloat(priceText);

    // If item exists, increment count; otherwise add new item
    if (cart[name]) {
      cart[name].count += 1;
    } else {
      cart[name] = { count: 1, price: price };
    }

    // Persist cart to localStorage for persistence across page loads
    localStorage.setItem("ritchiesCart", JSON.stringify(cart));
    console.log(cart);
    updateCartCount();
    renderCartDropdown();
  }
}

document.addEventListener("click", addItemToCart);

// ============================================================================
// CART DROPDOWN INTERACTION
// ============================================================================

/**
 * Toggle cart dropdown visibility when cart icon is clicked
 * Refreshes cart items before showing
 */
if (cartIcon && cartDropdown) {
  cartIcon.addEventListener("click", () => {
    if (cartDropdown.style.display === "block") {
      cartDropdown.style.display = "none";
    } else {
      renderCartDropdown(); // Refresh items before showing
      cartDropdown.style.display = "block";
    }
  });
}

/**
 * Global click handler for cart-related interactions
 * Handles: delete buttons, checkout remove buttons, and click-outside-to-close
 */
document.addEventListener("click", (event) => {
  // Handle delete button clicks in cart dropdown
  if (event.target.classList.contains("cart-item-delete")) {
    const itemName = event.target.getAttribute("data-item");
    removeItemFromCart(itemName);
    return;
  }

  // Handle remove button clicks on checkout page
  if (event.target.classList.contains("checkout-item-remove")) {
    const itemName = event.target.getAttribute("data-item");
    removeItemFromCart(itemName);
    return;
  }

  // Close cart dropdown when clicking outside of cart area
  if (cartDropdown && cartIcon) {
    const isClickInsideCart =
      cartDropdown.contains(event.target) || cartIcon.contains(event.target);
    if (!isClickInsideCart && cartDropdown.style.display === "block") {
      cartDropdown.style.display = "none";
    }
  }
});

// ============================================================================
// CHECKOUT MODAL INTERACTIONS
// ============================================================================

/**
 * Navigate to checkout page when proceed button is clicked
 * Saves cart to localStorage for persistence across page navigation
 */
if (proceedButton) {
  proceedButton.addEventListener("click", () => {
    // Save cart to localStorage and navigate to checkout page
    localStorage.setItem("ritchiesCart", JSON.stringify(cart));
    window.location.href = "checkout.html";
  });
}

/**
 * Cancel/close checkout modal
 * Resets form to clear any entered data
 */
if (cancelCheckout) {
  cancelCheckout.addEventListener("click", () => {
    checkoutModal.style.display = "none";
    checkoutForm.reset();
  });
}

/**
 * Handle checkout form submission (modal version)
 * Shows success message, clears cart, and closes modal after 3 seconds
 */
if (checkoutForm) {
  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("checkoutEmail").value;
    const phone = document.getElementById("checkoutPhone").value;

    // Provide success feedback
    if (successMessage) {
      successMessage.style.display = "block";
    }

    // Clear the cart and update display after successful submission
    cart = {};
    localStorage.removeItem("ritchiesCart");
    updateCartCount();
    renderCartDropdown();

    // Keep modal open briefly to show success message, then close after 3 seconds
    setTimeout(() => {
      if (checkoutModal) {
        checkoutModal.style.display = "none";
      }
      checkoutForm.reset();
    }, 3000);
  });
}

// ============================================================================
// NEWSLETTER SUBSCRIPTION FORM
// ============================================================================

const newsletterForm = document.getElementById("newsletterForm");
const newsletterMessage = document.getElementById("newsletterMessage");

/**
 * Handle newsletter signup form submission
 * Shows success message for 5 seconds then hides it
 */
if (newsletterForm && newsletterMessage) {
  newsletterForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const emailInput = document.getElementById("newsletterEmail");
    const email = emailInput.value;

    // Display success message
    newsletterMessage.textContent =
      "Thank you for subscribing! Check your email for updates.";
    newsletterMessage.style.color = "var(--accent)";
    newsletterMessage.style.display = "block";

    // Clear form input
    newsletterForm.reset();

    // Auto-hide message after 5 seconds
    setTimeout(() => {
      newsletterMessage.style.display = "none";
    }, 5000);
  });
}

// ============================================================================
// CONTACT FORM SUBMISSION
// ============================================================================

const contactForm = document.querySelector(".contact-form form");
const contactMessage = document.getElementById("contactMessage");

/**
 * Handle contact form submission
 * Shows success message for 5 seconds then hides it
 */
if (contactForm && contactMessage) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    // Display success message
    contactMessage.textContent =
      "Thank you! Your message has been sent. We will get back to you soon.";
    contactMessage.style.color = "var(--accent)";
    contactMessage.style.display = "block";

    // Clear form inputs
    contactForm.reset();

    // Scroll to message
    contactMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Auto-hide message after 8 seconds
    setTimeout(() => {
      contactMessage.style.display = "none";
    }, 8000);
  });
}

// ============================================================================
// CHECKOUT PAGE LOGIC
// ============================================================================

/**
 * Load cart data from localStorage
 * Called when checkout page loads to restore cart state
 */
function loadCartFromStorage() {
  const savedCart = localStorage.getItem("ritchiesCart");
  if (savedCart) {
    cart = JSON.parse(savedCart);
  }
}

/**
 * Render the checkout page with cart items and order summary
 * Shows empty cart message if no items, otherwise displays items with remove buttons
 */
function renderCheckoutPage() {
  const checkoutItemsList = document.getElementById("checkoutItemsList");
  const orderTotal = document.getElementById("orderTotal");
  const checkoutFormSection = document.querySelector(".checkout-form-section");
  const orderSummary = document.querySelector(".order-summary");

  if (!checkoutItemsList) return; // Guard: Not on checkout page

  console.log("Rendering checkout page. Cart:", cart);
  const cartItemsArray = Object.keys(cart);

  if (cartItemsArray.length === 0) {
    // Hide form and order summary when cart is empty
    if (checkoutFormSection) checkoutFormSection.style.display = "none";
    if (orderSummary) orderSummary.style.display = "none";

    const checkoutContainer = document.querySelector(".checkout-container");
    if (checkoutContainer) {
      checkoutContainer.innerHTML = `
                <div class="empty-checkout-message">
                    <h2>YOUR CART IS EMPTY</h2>
                    <p>Add some items to your cart before checking out.</p>
                    <a href="products.html" class="cta-button">CONTINUE SHOPPING</a>
                </div>
            `;
    }
    return;
  }

  // Show form and order summary when cart has items
  if (checkoutFormSection) checkoutFormSection.style.display = "block";
  if (orderSummary) orderSummary.style.display = "block";

  let total = 0;
  checkoutItemsList.innerHTML = "";

  cartItemsArray.forEach((itemName) => {
    const item = cart[itemName];
    const itemTotal = item.count * item.price;
    total += itemTotal;

    const itemElement = document.createElement("div");
    itemElement.classList.add("checkout-item");

    itemElement.innerHTML = `
            <div class="checkout-item-details">
                <span class="checkout-item-name">${itemName}</span>
                <span class="checkout-item-quantity">Quantity: ${
                  item.count
                } × $${item.price.toFixed(2)}</span>
            </div>
            <div class="checkout-item-actions">
                <span class="checkout-item-price">$${itemTotal.toFixed(
                  2
                )}</span>
                <button class="checkout-item-remove" data-item="${itemName}" aria-label="Remove ${itemName}">✕</button>
            </div>
        `;
    checkoutItemsList.appendChild(itemElement);
  });

  if (orderTotal) {
    orderTotal.textContent = `$${total.toFixed(2)}`;
  }
}

// Handle checkout page form submission
const checkoutPageForm = document.getElementById("checkoutPageForm");
const checkoutSuccessMessage = document.getElementById(
  "checkoutSuccessMessage"
);

if (checkoutPageForm && checkoutSuccessMessage) {
  checkoutPageForm.addEventListener("submit", (event) => {
    event.preventDefault();

    // Hide form and show success message
    checkoutPageForm.style.display = "none";
    checkoutSuccessMessage.style.display = "block";

    // Clear cart
    cart = {};
    localStorage.removeItem("ritchiesCart");
    updateCartCount();

    // Scroll to success message
    checkoutSuccessMessage.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

// --- BELL SOUND ON HOME CLICK ---
function playBellSound(event) {
  console.log("playBellSound called");
  const bellSound = document.getElementById("bellSound");
  console.log("Bell sound element:", bellSound);

  if (bellSound) {
    bellSound.currentTime = 0;
    console.log("Attempting to play audio...");
    bellSound
      .play()
      .then(() => {
        console.log("Audio played successfully");
      })
      .catch((error) => {
        console.error("Audio play failed:", error);
      });
  } else {
    console.error("Bell sound element not found");
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  // Load cart
  loadCartFromStorage();
  console.log("Cart loaded:", cart);
  updateCartCount();
  renderCartDropdown();
  renderCheckoutPage();

  // Add bell sound to home links
  const homeLink = document.getElementById("homeLink");
  const logoLink = document.getElementById("logoLink");
  const bellSound = document.getElementById("bellSound");

  console.log("homeLink:", homeLink);
  console.log("logoLink:", logoLink);
  console.log("bellSound element:", bellSound);

  if (homeLink) {
    homeLink.addEventListener("click", (e) => {
      // Set flag to play sound on home page
      localStorage.setItem("playBellOnLoad", "true");
    });
  }

  if (logoLink) {
    logoLink.addEventListener("click", (e) => {
      // Set flag to play sound on home page
      localStorage.setItem("playBellOnLoad", "true");
    });
  }

  // Play sound if flag is set (on home page load)
  const shouldPlayBell = localStorage.getItem("playBellOnLoad");
  if (
    shouldPlayBell === "true" &&
    (window.location.pathname.includes("index.html") ||
      window.location.pathname === "/" ||
      window.location.pathname.endsWith("/"))
  ) {
    localStorage.removeItem("playBellOnLoad");
    playBellSound();
  }

  // Mobile Menu Functionality
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const mobileMenuClose = document.getElementById("mobileMenuClose");
  const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");
  const nav = document.querySelector("nav");

  function openMobileMenu() {
    if (nav) {
      nav.classList.add("mobile-menu-active");
    }
    if (mobileMenuOverlay) {
      mobileMenuOverlay.classList.add("active");
    }
    // Prevent body scroll when menu is open
    document.body.style.overflow = "hidden";
  }

  function closeMobileMenu() {
    if (nav) {
      nav.classList.remove("mobile-menu-active");
    }
    if (mobileMenuOverlay) {
      mobileMenuOverlay.classList.remove("active");
    }
    // Re-enable body scroll
    document.body.style.overflow = "";
  }

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", openMobileMenu);
  }

  if (mobileMenuClose) {
    mobileMenuClose.addEventListener("click", closeMobileMenu);
  }

  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener("click", closeMobileMenu);
  }

  // Close menu when a navigation link is clicked
  const navLinks = document.querySelectorAll("nav a");
  navLinks.forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });
});
