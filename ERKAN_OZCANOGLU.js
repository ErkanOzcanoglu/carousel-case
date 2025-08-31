(() => {
  const CONFIG = {
    API_URL:"https://gist.githubusercontent.com/sevindi/8bcbde9f02c1d4abe112809c974e1f49/raw/9bf93b58df623a9b16f1db721cd0a7a539296cf0/products.json",
    CAROUSEL_TITLE: "Beğenebileceğinizi düşündüklerimiz",
    STORAGE_KEY: "ebebek_favorites",
    STORAGE_PRODUCTS_KEY: "ebebek_products_cache",
  };

  let products = [];
  let currentSlide = 0;
  let favorites = [];

  const init = () => {
    if (!isHomepageCheck()) {
      console.log("wrong page");
      return;
    }

    loadFavorites();

    const cachedProducts = getCachedProducts();
    if (cachedProducts) {
      products = cachedProducts;
      buildCarousel();
    } else {
      fetchProducts();
    }
  };

  const isHomepageCheck = () => {
    const currentPath = window.location.pathname;
    const isHomepage = currentPath === '/' || currentPath.endsWith('/');
    return (isHomepage);
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(CONFIG.API_URL);
      if (!response.ok) throw new Error("Network response was not ok");
      products = await response.json();

      cacheProducts(products);

      buildCarousel();
    } catch (error) {
      console.error(error);
    }
  };

  const cacheProducts = (products) => {
    try {
      localStorage.setItem(
        CONFIG.STORAGE_PRODUCTS_KEY,
        JSON.stringify({
          data: products,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error(error);
    }
  };

  const getCachedProducts = () => {
    try {
      const cached = localStorage.getItem(CONFIG.STORAGE_PRODUCTS_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 3600000) {
        return parsed.data;
      }

      return null;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
      favorites = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error(error);
      favorites = [];
    }
  };

  const saveFavorites = () => {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error(error);
    }
  };

  const toggleFavorite = (productId) => {
    const index = favorites.indexOf(productId);
    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(productId);
    }
    saveFavorites();
    updateSingleHeartIcon(productId);
  };

  const updateSingleHeartIcon = (productId) => {
    const heart = document.querySelector(`.ebebek-heart[data-product-id="${productId}"]`);
    if (!heart) return;
    
    const isFavorite = favorites.includes(parseInt(productId));
    const icon = heart.querySelector("i");

    if (isFavorite) {
      icon.className = "fas fa-heart heart-icon";
      icon.style.color = "#ff8800";
    } else {
      icon.className = "far fa-heart heart-icon";
      icon.style.removeProperty('color');
    }
  };

  const calculateDiscount = (price, originalPrice) => {
    if (price === originalPrice) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };


    const createProductCard = (product) => {
    const isFavorite = favorites.includes(product.id);
    const discountPercent = calculateDiscount(
      product.price,
      product.original_price
    );
    const hasCartDiscount = product.price > product.original_price;

    return `
    <div class="ebebek-product-item" data-product-id="${product.id}">
      <div class="ebebek-product-image-container">
        <img src="${product.img}" alt="${product.name}" class="ebebek-product-image">
        <div class="ebebek-heart ${ isFavorite ? "favorite" : "" }" data-product-id="${product.id}">
          <i class="${ isFavorite ? "fas fa-heart" : "far fa-heart" } heart-icon"></i>
        </div>
      </div>
      
      <div class="ebebek-product-content">
        <div class="ebebek-product-brand">
          <strong>${product.brand} - </strong>
          <span class="ebebek-product-description">${product.name}</span>
        </div>
        
        <div class="ebebek-stars-wrapper">
               <div class="ebebek-star-rating">
                 ${Array.from({ length: 5 }, (_, i) => 
                   `<i class="ebebek-star fas fa-star ${i < product.rating ? 'filled' : ''}"></i>`
                 ).join('')}
               </div>
             </div>
               ${hasCartDiscount ? `<div class="ebebek-sepet-price">Sepette ${product.original_price} TL</div>` : ''}
        </div>

        
         <div class="ebebek-product-price">
           ${
             product.price !== product.original_price && !hasCartDiscount
             ? `
        <div class="ebebek-price-row">
          <div class="ebebek-price-original">${product.original_price} TL</div>
          <div class="ebebek-discount-badge">%${discountPercent}</div>
        </div>
        ` : ''
        }
        <div class="ebebek-price-current ${product.price !== product.original_price && !hasCartDiscount ? 'discounted' : ''}">${product.price} TL</div>
        </div>
      
      <div class="ebebek-add-to-cart-wrapper">
        <button class="ebebek-btn-add-circle">
          <div class="ebebek-inner-btn">
            <i class="ebebek-add-icon fas fa-plus"></i>
            <i class="ebebek-add-icon-hovered fas fa-plus"></i>
          </div>
        </button>
      </div>
    </div>
        `;
  };

  const buildCarousel = () => {

    if (!products.length) {
      return;
    }

    if (document.querySelector('.ebebek-carousel-wrapper')) {
      return;
    }

    const insertionPoint =
      document.querySelector(".banner") ||
      document.querySelector("eb-product-carousel") ||
      document.querySelector(".ins-preview-wrapper") ||
      document.body;

    const carouselHTML = `
            <div class="container main-container">
                <div class="ebebek-carousel-header">
                    <h2>${CONFIG.CAROUSEL_TITLE}</h2>
                </div>
                <div class="ebebek-carousel-wrapper">
                    <button class="ebebek-carousel-nav ebebek-carousel-prev" aria-label="Previous">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="ebebek-carousel-track">
                        <div class="ebebek-carousel-slides">
                            ${products
                              .map((product) => createProductCard(product))
                              .join("")}
                        </div>
                    </div>
                    <button class="ebebek-carousel-nav ebebek-carousel-next" aria-label="Next">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;

    if (insertionPoint.classList.contains("banner")) {
      insertionPoint.insertAdjacentHTML("afterend", carouselHTML);
    } else {
      document.body.insertAdjacentHTML("beforeend", carouselHTML);
    }

    buildCSS();
    setEvents();
    updateCarousel();
  };

  const buildCSS = () => {

    if (document.querySelector('#ebebek-carousel-styles')) {
      return;
    }

    if (!document.querySelector('link[href*="font-awesome"]') && !document.querySelector('script[src*="font-awesome"]')) {
      const fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.rel = 'stylesheet';
      fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
      document.head.appendChild(fontAwesomeLink);
    } 

    const css = `
        .main-container {
          margin-top: 10px;
          width: 100%;
        }

        @media (max-width: 576px) {
          .container,.container-sm {
              max-width:100vw;
              padding-left: 15px;
              padding-right: 15px
          }
        }

        @media (min-width: 576px) {
            .container,.container-sm {
                max-width:540px
            }
        }

        @media (min-width: 768px) {
            .container,.container-md,.container-sm {
                max-width:720px
            }
        }

        @media (min-width: 992px) {
            .container,.container-lg,.container-md,.container-sm {
                max-width:960px
            }
        }

        @media (min-width: 1280px) {
            .container,.container-lg,.container-md,.container-sm,.container-xl {
                max-width:1180px
            }
        }

        @media (min-width: 1480px) {
            .container,.container-lg,.container-md,.container-sm,.container-xl {
                max-width:1296px
            }
        }

        @media (min-width: 1580px) {
            .container {
                max-width:1320px
            }
        }

        .ebebek-carousel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: Quicksand-SemiBold;
            font-weight: 700;
        }

        .ebebek-carousel-header h2 {
            color: var(--Primary-Black);
            font-size: 24px;
            margin: 0;
        }

        .ebebek-carousel-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            padding-top:20px;
            padding-bottom:20px;
        }

        .ebebek-carousel-track {
            flex: 1;
            overflow: hidden;
            cursor: pointer;
            transition: none;
        }

        .ebebek-carousel-track.dragging {
            cursor: grabbing;
            user-select: none;
        }

        .ebebek-carousel-slides {
            display: flex;
            transition: transform 0.3s ease;
        }

        .ebebek-product-item {
            flex: 0 0 calc(95% / 5);
            margin-right: 16px;
            width: 100%;
            font-family: Quicksand-Medium;
            font-size: 12px;
            border: 1px solid var(--Neutral-200);
            border-radius: 8px;
            position: relative;
            text-decoration: none;
            background-color: var(--Neutral-0---White);
            overflow: hidden;
            height: 420px; 
            display: flex;
            flex-direction: column;
        }

        .ebebek-product-item:hover {
            border: 1px solid rgba(0,0,0,.125)
        }

        .ebebek-product-image-container {
            position: relative;
            width: 100%;
            height: 250px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .ebebek-product-image {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        .ebebek-heart {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            color: #a2b2bd;
        }

        .ebebek-heart:hover .heart-icon,
        .ebebek-heart:hover .fas.fa-heart,
        .ebebek-heart:hover .far.fa-heart {
            color: #ff8800 !important;
            transition: color 0.2s ease;
        }

        .ebebek-heart.favorite .heart-icon,
        .ebebek-heart.favorite .fas.fa-heart,
        .ebebek-heart.favorite .far.fa-heart {
            color: #ff8800 !important;
        }

        .ebebek-product-content {
            padding: 0 10px;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .ebebek-product-brand {
            font-size: 12px;
            color: var(--Primary-Black);
            text-overflow: ellipsis;
            overflow: hidden;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            display: -webkit-box;
            margin-bottom: 8px;
            min-height: 32px; 
        }

        .ebebek-product-brand strong {
            color: var(--Primary-Black);
            font-weight: 600;
        }

        .ebebek-product-description {
            color: var(--Primary-Black);
        }

        .ebebek-stars-wrapper {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            min-height: 20px; 
        }

        .ebebek-star-rating {
            display: flex;
            align-items: center;
        }

        .ebebek-star {
            font-size: 10px;
            color: #ffe8cc;
            margin-right: 2px;
        }

        .ebebek-product-price {
            position: relative;
            display: flex;
            justify-content: flex-end;
            flex-direction: column;
            padding: 6px 10px 15px;
            align-items: flex-start;
            margin-top: auto; 
        }

        .ebebek-price-row {
            display: flex;
            align-items: center;
            margin-bottom: 4px;
        }

        .ebebek-price-original {
            font-size: 14px;
            color: #999;
        }

        .ebebek-price-current {
            font-size: 16px;
            font-weight: 600;
            color: var(--Primary-Black);
        }

        .ebebek-price-current.discounted {
            color: var(--Success-400);
        }

        .ebebek-discount-badge {
            background: var(--Success-400);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 8px;
            display: inline-block;
         }

         .ebebek-sepet-price {
            color: var(--Secondary-400);
            font-size: 10px;
            font-family: Quicksand-SemiBold;
            display: flex;
            flex-direction: column;
            grid-gap: 12px;
            gap: 12px;
         }
             

        .ebebek-add-to-cart-wrapper {
            position: absolute;
            bottom: 4px;
            right: 4px;
        }

        .ebebek-btn-add-circle {
            width: 48px;
            height: 48px;
            font-size: 11px;
            font-family: Quicksand-SemiBold;
            background: unset;
            border: none;
            border-radius: 100%;
            overflow: hidden;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }

        .ebebek-inner-btn {
            width: 40px;
            height: 40px;
            background-color: var(--Neutral-0---White);
            color: var(--Primary-400---Primary);
            box-shadow: 0 6px 2px 0 #b0b0b003, 0 2px 9px 0 #b0b0b014, 0 2px 4px 0 #b0b0b024, 0 0 1px 0 #b0b0b03d, 0 0 1px 0 #b0b0b047;
            border-radius: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ebebek-btn-add-circle:hover .ebebek-inner-btn {
            background-color: var(--Primary-400---Primary);
        }

        .ebebek-add-icon {
            width: 14px;
            display: inline-block;
            color: var(--Primary-400---Primary);
        }

        .ebebek-add-icon-hovered {
            display: none;
            color: white;
        }

        .ebebek-btn-add-circle:hover .ebebek-add-icon {
            display: none;
        }

        .ebebek-btn-add-circle:hover .ebebek-add-icon-hovered {
            display: inline-block;
        }

        .ebebek-carousel-nav {
            display: flex !important;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background-color: var(--Neutral-0---White) !important;
            border-radius: 50% !important;
            position: absolute;
            box-shadow: 0 6px 2px 0 #b0b0b003, 0 2px 9px 0 #b0b0b014, 0 2px 4px 0 #b0b0b024, 0 0 1px 0 #b0b0b03d, 0 0 1px 0 #b0b0b047;
        }

        .ebebek-carousel-nav.ebebek-carousel-prev {
            left: -65px;
            bottom: 50%;
            top: auto;
        }
        .ebebek-carousel-nav.ebebek-carousel-next {
            right: -65px;
            bottom: 50%;
            top: auto;
        }

        @media (max-width: 1480px) {
            .ebebek-product-item {
                flex: 0 0 calc(95% / 4);
            }
        }
        
        @media (max-width: 1280px) {
            .ebebek-product-item {
                flex: 0 0 calc(95.5% / 3);
            }
        }

        @media (max-width: 992px) {
            .ebebek-product-item {
                flex: 0 0 calc(95.5% / 2);
            } 
            .ebebek-carousel-nav {
                width: 35px;
                height: 35px;
            }
        }

        @media (max-width: 768px) {
            .ebebek-product-item {
                flex: 0 0 calc(95.5% / 2);
            }
            
        }

        @media (max-width: 576px) {
            .ebebek-product-item {
                flex: 0 0 calc(95.5% / 2);
            }
        }
        
        .fas, .far {
            font-family: 'Font Awesome 5 Free', sans-serif;
            font-weight: 900;
        }

        .far {
            font-weight: 400;
        }
    `;

    const styleElement = document.createElement("style");
    styleElement.id = "ebebek-carousel-styles";
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
  };

  const setEvents = () => {

    const productItems = document.querySelectorAll(".ebebek-product-item");

    productItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.closest(".ebebek-heart") || e.target.closest(".ebebek-btn-add-circle")) return;

        const productId = item.dataset.productId;
        const product = products.find((p) => p.id == productId);
        if (product) {
          window.open(product.url, "_blank");
        }
      });
    });

    const hearts = document.querySelectorAll(".ebebek-heart");
    hearts.forEach((heart) => {
      heart.addEventListener("click", (e) => {
        e.stopPropagation();
        const productId = parseInt(heart.dataset.productId);
        toggleFavorite(productId);
      });
    });

    const prevBtn = document.querySelector(".ebebek-carousel-prev");
    const nextBtn = document.querySelector(".ebebek-carousel-next");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => navigateCarousel(-1));
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => navigateCarousel(1));
    }

    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let hasMoved = false;
    let dragThreshold = 30; 

    const track = document.querySelector(".ebebek-carousel-track");
    if (track) {
      track.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        hasMoved = false;
        track.classList.add('dragging');
      });

      track.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diff = startX - currentX;

        if (Math.abs(diff) > dragThreshold) {
          hasMoved = true;
        }
      });

      track.addEventListener("touchend", () => {
        if (!isDragging) return;

        const diff = startX - currentX;

        if (hasMoved && Math.abs(diff) > dragThreshold) {
          if (diff > 0) {
            navigateCarousel(1);
          } else {
            navigateCarousel(-1);
          }
        }

        isDragging = false;
        hasMoved = false;
        track.style.cursor = '';
        track.style.userSelect = '';
      });

      track.addEventListener("mousedown", (e) => {
        startX = e.clientX;
        isDragging = true;
        hasMoved = false;
        track.style.cursor = 'grabbing';
        track.style.userSelect = 'none';
        e.preventDefault();
      });

      track.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        currentX = e.clientX;
        const diff = startX - currentX;

        if (Math.abs(diff) > dragThreshold) {
          hasMoved = true;
        }
      });

      track.addEventListener("mouseup", () => {
        if (!isDragging) return;

        const diff = startX - currentX;

        if (hasMoved && Math.abs(diff) > dragThreshold) {
          if (diff > 0) {
            navigateCarousel(1);
          } else {
            navigateCarousel(-1);
          }
        }

        isDragging = false;
        hasMoved = false;
        track.style.cursor = '';
        track.style.userSelect = '';
      });

      track.addEventListener("mouseleave", () => {
        if (isDragging) {
          isDragging = false;
          hasMoved = false;
          track.style.cursor = '';
          track.style.userSelect = '';
        }
      });

      track.addEventListener("dragstart", (e) => {
        e.preventDefault();
      });
    }
  };

  const navigateCarousel = (direction) => {
    const slidesContainer = document.querySelector(".ebebek-carousel-slides");
    const items = document.querySelectorAll(".ebebek-product-item");
    const itemsPerView = getItemsPerView();

    if (!slidesContainer || !items.length) return;

    const maxSlide = Math.max(0, items.length - itemsPerView);
    currentSlide = Math.max(0, Math.min(maxSlide, currentSlide + direction));

    updateCarousel();
  };

  const getItemsPerView = () => {
    if (window.innerWidth <= 990) return 2;
    if (window.innerWidth <= 1280) return 3;
    if (window.innerWidth <= 1480) return 4;
    return 5;
  };

  const updateCarousel = () => {
    const slidesContainer = document.querySelector(".ebebek-carousel-slides");
    const itemsPerView = getItemsPerView();
    const itemWidth = 100 / itemsPerView;
    const translateX = -(currentSlide * itemWidth);

    if (slidesContainer) {
      slidesContainer.style.transform = `translateX(${translateX}%)`;
    }
  };

  window.addEventListener("resize", () => {
    currentSlide = 0;
    updateCarousel();
  });

  init();
})();
