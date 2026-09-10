var API_URL = "https://script.google.com/macros/s/AKfycbyojAy2H8xpT74OARTBWDv2SYUDINOWjzkRFzacfWIxE2AgY46AcFrnPItSqZWKls-D/exec";

console.log("CATALOG: JS ЗАПУСТИЛСЯ", new Date().toLocaleTimeString());

var urlParams = new URLSearchParams(window.location.search);

var selectedCategory = urlParams.get("category") || "all";



var allProducts = [];

var visibleProducts = [];



var cart = JSON.parse(localStorage.getItem("user_cart") || "[]");



var currentImageIndex = 0;

var currentProductImages = [];



var FALLBACK_IMAGE = "error.png";



// Настройки постепенной загрузки

var BATCH_SIZE = 6;

var loadedCount = 0;

var isLoadingBatch = false;





// ==================================================

// ЗАПУСК

// ==================================================



document.addEventListener("DOMContentLoaded", function() {



    // ------------------------------

    // Telegram

    // ------------------------------



    var tgInput = document.getElementById("cart-tg");

    var tgPlaceholder = document.getElementById("tg-placeholder");



    if (tgInput) {



        function updateTgPlaceholder() {

            if (tgInput.value === "@") {

                tgPlaceholder.style.display = "block";

            } else {

                tgPlaceholder.style.display = "none";

            }

        }



        tgInput.addEventListener("input", function() {



            var value = this.value;



            value = value.replace(/[^a-zA-Z0-9_]/g, "");



            this.value = "@" + value;



            updateTgPlaceholder();

        });



        tgInput.addEventListener("focus", function() {



            if (!this.value.startsWith("@")) {

                this.value = "@" + this.value;

            }



            if (this.selectionStart === 0) {

                this.setSelectionRange(1, 1);

            }



            updateTgPlaceholder();

        });



        updateTgPlaceholder();

    }





    // ------------------------------

    // Телефон

    // ------------------------------



    var phoneInput = document.getElementById("cart-phone");



    if (phoneInput) {



        phoneInput.addEventListener("input", function() {



            this.value = this.value.replace(/\D/g, "");



        });



    }





    // ------------------------------

    // Корзина

    // ------------------------------



    updateCartUI();





    // ------------------------------

    // Каталог

    // ------------------------------



    var productsContainer = document.querySelector("#products");



    if (!productsContainer) {

        return;

    }





    // Подсветка выбранной категории



    var catButtons = document.querySelectorAll(".category, .category-btn");



    catButtons.forEach(function(btn) {



        if (btn.getAttribute("data-cat") === selectedCategory) {

            btn.classList.add("active");

        } else {

            btn.classList.remove("active");

        }



    });





    // Показываем первоначальную загрузку



    showCatalogLoading();





    // ------------------------------

    // Получаем данные

    // ------------------------------


    console.log("CATALOG: НАЧАЛ FETCH", new Date().toLocaleTimeString());

    fetch(API_URL)



        .then(function(res) {

            console.log("CATALOG: ПОЛУЧИЛ RESPONSE", new Date().toLocaleTimeString());

            if (!res.ok) {

                throw new Error("HTTP error: " + res.status);

            }



            return res.json();



        })



        .then(function(data) {



            console.log("ДАННЫЕ ИЗ ТАБЛИЦЫ:", data);





            // Проверяем товары



            allProducts = filterValidProducts(data);





            // Только товары в наличии



            visibleProducts = allProducts.filter(function(product) {



                var status = String(

                    product["СТАТУС"] || ""

                ).trim().toLowerCase();



                return status === "в наличии";



            });





            // Сортировка



            visibleProducts.sort(function(a, b) {



                return Number(a["ПОРЯДОК"] || 999999) -

                       Number(b["ПОРЯДОК"] || 999999);



            });





            // Фильтр категории



            if (selectedCategory !== "all") {



                visibleProducts = visibleProducts.filter(function(product) {



                    var cat = String(

                        product["КАТЕГОРИЯ"] || ""

                    ).toLowerCase();



                    return cat.includes(

                        selectedCategory.toLowerCase()

                    );



                });



            }





            console.log(

                "ТОВАРОВ В КАТЕГОРИИ:",

                visibleProducts

            );





            // Сбрасываем счётчик



            loadedCount = 0;





            // Если товаров нет



            if (visibleProducts.length === 0) {



                productsContainer.innerHTML =

                    "<p style='color: #888; text-align: center; width: 100%; grid-column: 1/-1;'>" +

                    "Товары не найдены" +

                    "</p>";



                hideCatalogLoading();



                return;

            }





            // Первая партия



            loadNextBatch(productsContainer);



        })



        .catch(function(err) {



            console.error("Ошибка загрузки:", err);



            productsContainer.innerHTML =

                "<p style='color: rgb(255, 0, 51); text-align: center; width: 100%; grid-column: 1/-1;'>" +

                "Ошибка загрузки товаров, перезайдите на страницу." +

                "</p>";



            hideCatalogLoading();



        });





    // ------------------------------

    // Следующие партии

    // ------------------------------



    window.addEventListener("scroll", function() {



        if (isLoadingBatch) {

            return;

        }



        if (loadedCount >= visibleProducts.length) {

            return;

        }





        // Насколько близко пользователь к низу страницы



        var scrollPosition =

            window.innerHeight + window.scrollY;



        var pageHeight =

            document.documentElement.scrollHeight;





        // Начинаем загрузку примерно за 2 карточки до конца



        if (scrollPosition >= pageHeight - 700) {



            loadNextBatch(productsContainer);



        }



    });





    // Модальные окна



    setupModalEvents();



});





// ==================================================

// ФИЛЬТРАЦИЯ

// ==================================================



function filterValidProducts(products) {



    return products.filter(function(product) {



        var name = String(

            product["НАЗВАНИЕ"] || ""

        ).trim();



        var id = String(

            product["0000"] ||

            product["ID"] ||

            ""

        ).trim();



        return name !== "" || id !== "";



    });



}





// ==================================================

// ПОКАЗ ЗАГРУЗКИ

// ==================================================



function showCatalogLoading() {



    var loader = document.getElementById("catalog-loading");



    if (loader) {

        loader.style.display = "block";

    }



}





function hideCatalogLoading() {



    var loader = document.getElementById("catalog-loading");



    if (loader) {

        loader.style.display = "none";

    }



}





// ==================================================

// ЗАГРУЗКА СЛЕДУЮЩЕЙ ПАРТИИ

// ==================================================



function loadNextBatch(container) {



    if (isLoadingBatch) {

        return;

    }



    if (loadedCount >= visibleProducts.length) {



        hideCatalogLoading();



        return;

    }





    isLoadingBatch = true;



    showCatalogLoading();





    // Берём следующие 6 товаров



    var nextProducts =

        visibleProducts.slice(

            loadedCount,

            loadedCount + BATCH_SIZE

        );





    // Добавляем товары



    renderProducts(

        nextProducts,

        container

    );





    // Увеличиваем счётчик



    loadedCount += nextProducts.length;





    // Предзагружаем дополнительные фотографии

    // только для этой партии



    preloadProductImages(nextProducts);





    // Небольшая задержка нужна,

    // чтобы браузер успел отрисовать карточки



    setTimeout(function() {



        isLoadingBatch = false;





        // Если товаров больше нет —

        // полностью убираем загрузку



        if (loadedCount >= visibleProducts.length) {



            hideCatalogLoading();



        } else {



            hideCatalogLoading();





            // Если контента недостаточно для прокрутки,

            // автоматически загружаем следующую партию



            setTimeout(function() {



                var pageHeight =

                    document.documentElement.scrollHeight;



                var viewportBottom =

                    window.innerHeight +

                    window.scrollY;



                if (

                    viewportBottom >= pageHeight - 700 &&

                    loadedCount < visibleProducts.length

                ) {



                    loadNextBatch(container);



                }



            }, 100);



        }



    }, 150);



}





// ==================================================

// ОТРИСОВКА ТОВАРОВ

// ==================================================



function renderProducts(products, container) {



    products.forEach(function(product) {



        var card = document.createElement("article");



        card.className = "product-card";





        var id =

            product["0000"] ||

            product["ID"] ||

            "";



        var name =

            product["НАЗВАНИЕ"] ||

            "Без названия";



        var price =

            product["ЦЕНА"] ||

            0;



        var size =

            product["РАЗМЕР"] ||

            "M";





        var rawPhoto =

            String(

                product["ФОТО"] || ""

            ).trim();





        var photos =

            rawPhoto

                ? rawPhoto.split(",")

                : [FALLBACK_IMAGE];





        var mainImage =

            photos[0].trim() ||

            FALLBACK_IMAGE;





        card.innerHTML =



            '<div class="product-image-wrap">' +



                '<img src="' +

                    mainImage +

                    '" ' +

                    'alt="' +

                    name +

                    '" ' +

                    'class="product-img" ' +

                    'onerror="this.src=\'' +

                    FALLBACK_IMAGE +

                    '\'">' +



                '<span class="product-badge">' +

                    size +

                '</span>' +



            '</div>' +



            '<div class="product-details">' +



                '<h3 class="product-title">' +

                    name +

                '</h3>' +



                '<div class="product-bottom">' +



                    '<span class="product-price">' +

                        price +

                        ' ₽' +

                    '</span>' +



                    '<button class="buy-btn" data-id="' +

                        id +

                    '">' +

                        'СМОТРЕТЬ' +

                    '</button>' +



                '</div>' +



            '</div>';





        card.addEventListener(

            "click",

            function() {

                openProduct(id);

            }

        );





        container.appendChild(card);



    });



}





// ==================================================

// ОТКРЫТИЕ ТОВАРА

// ==================================================



function openProduct(id) {



    var item = allProducts.find(function(p) {



        return (

            p["0000"] == id ||

            p["ID"] == id

        );



    });





    if (!item) {

        return;

    }





    var rawPhoto =

        String(

            item["ФОТО"] || ""

        ).trim();





    currentProductImages =

        rawPhoto

            ? rawPhoto

                .split(",")

                .map(function(s) {

                    return s.trim();

                })

                .filter(Boolean)

            : [FALLBACK_IMAGE];





    currentImageIndex = 0;





    document.getElementById(

        "modal-title"

    ).innerText =

        item["НАЗВАНИЕ"] ||

        "Без названия";





    document.getElementById(

        "modal-price"

    ).innerText =

        (item["ЦЕНА"] || 0) +

        " ₽";





    document.getElementById(

        "modal-size"

    ).innerText =

        item["РАЗМЕР"] ||

        "Не указан";





    document.getElementById(

        "modal-desc"

    ).innerText =

        item["ОПИСАНИЕ"] ||

        "Описание отсутствует.";





    updateModalImage();





    var addToCartBtn =

        document.getElementById(

            "modal-buy-btn"

        );





    if (addToCartBtn) {



        addToCartBtn.innerText =

            "ДОБАВИТЬ В КОРЗИНУ";





        addToCartBtn.onclick =

            function() {



                addToCart(item);



                document

                    .getElementById(

                        "product-modal"

                    )

                    .classList

                    .remove("active");





                openCartModal();



            };



    }





    document

        .getElementById("product-modal")

        .classList

        .add("active");



}





// ==================================================

// ГАЛЕРЕЯ

// ==================================================



function updateModalImage() {



    var imgEl =

        document.getElementById(

            "modal-img"

        );





    var counterEl =

        document.getElementById(

            "gallery-counter"

        );





    if (

        imgEl &&

        currentProductImages.length > 0

    ) {



        imgEl.onerror =

            function() {

                this.src =

                    FALLBACK_IMAGE;

            };





        imgEl.src =

            currentProductImages[

                currentImageIndex

            ];



    }





    if (counterEl) {



        counterEl.innerText =

            (currentImageIndex + 1) +

            " / " +

            currentProductImages.length;



    }



}





function prevImage() {



    if (

        currentProductImages.length <= 1

    ) {

        return;

    }





    currentImageIndex =

        (

            currentImageIndex -

            1 +

            currentProductImages.length

        ) %

        currentProductImages.length;





    updateModalImage();



}





function nextImage() {



    if (

        currentProductImages.length <= 1

    ) {

        return;

    }





    currentImageIndex =

        (

            currentImageIndex + 1

        ) %

        currentProductImages.length;





    updateModalImage();



}





// ==================================================

// FULLSCREEN ФОТО

// ==================================================



function openFullscreenImage() {



    var fullscreenModal =

        document.getElementById(

            "fullscreen-image-modal"

        );





    var fullscreenImg =

        document.getElementById(

            "fullscreen-img"

        );





    var fullscreenCounter =

        document.getElementById(

            "fullscreen-counter"

        );





    if (

        !fullscreenModal ||

        !fullscreenImg

    ) {

        return;

    }





    if (

        currentProductImages.length === 0

    ) {

        return;

    }





    fullscreenModal

        .classList

        .add("active");





    fullscreenImg.style.width =

        "100%";





    fullscreenImg.style.height =

        "100%";





    fullscreenImg.src =

        currentProductImages[

            currentImageIndex

        ];





    if (fullscreenCounter) {



        fullscreenCounter.innerText =

            (currentImageIndex + 1) +

            " / " +

            currentProductImages.length;



    }



}





function closeFullscreenImage() {



    var fullscreenModal =

        document.getElementById(

            "fullscreen-image-modal"

        );





    if (fullscreenModal) {



        fullscreenModal

            .classList

            .remove("active");



    }



}





function fullscreenPrevImage() {



    if (

        currentProductImages.length <= 1

    ) {

        return;

    }





    currentImageIndex =

        (

            currentImageIndex -

            1 +

            currentProductImages.length

        ) %

        currentProductImages.length;





    updateModalImage();



    openFullscreenImage();



}





function fullscreenNextImage() {



    if (

        currentProductImages.length <= 1

    ) {

        return;

    }





    currentImageIndex =

        (

            currentImageIndex + 1

        ) %

        currentProductImages.length;





    updateModalImage();



    openFullscreenImage();



}





// ==================================================

// КОРЗИНА

// ==================================================



function addToCart(item) {



    var id =

        item["0000"] ||

        item["ID"] ||

        "";





    var exists =

        cart.some(function(p) {

            return p.id === id;

        });





    if (exists) {



        alert(

            "Эта вещь уже в вашей корзине!"

        );



        return;

    }





    var rawPhoto =

        String(

            item["ФОТО"] || ""

        ).trim();





    var firstPhoto =

        rawPhoto

            ? rawPhoto

                .split(",")[0]

                .trim()

            : FALLBACK_IMAGE;





    cart.push({



        id: id,



        name:

            item["НАЗВАНИЕ"] ||

            "Без названия",



        price:

            item["ЦЕНА"] ||

            0,



        size:

            item["РАЗМЕР"] ||

            "-",



        cell:

            item["ЯЧЕЙКА"] ||

            "Не указана",



        image:

            firstPhoto



    });





    saveCart();



    updateCartUI();



}





function removeFromCart(id) {



    cart =

        cart.filter(function(item) {

            return item.id !== id;

        });





    saveCart();



    updateCartUI();



    renderCartItems();



}





function saveCart() {



    localStorage.setItem(

        "user_cart",

        JSON.stringify(cart)

    );



}





function updateCartUI() {



    var cartBadge =

        document.querySelector(

            "#cart-count"

        );





    if (cartBadge) {



        cartBadge.innerText =

            cart.length;



    }



}





function renderCartItems() {



    var cartListContainer =

        document.getElementById(

            "cart-items-list"

        );





    var cartTotalEl =

        document.getElementById(

            "cart-total-price"

        );





    var cartFooter =

        document.getElementById(

            "cart-footer"

        );





    if (!cartListContainer) {

        return;

    }





    cartListContainer.innerHTML = "";



    var total = 0;





    if (cart.length === 0) {



        cartListContainer.innerHTML =

            "<p style='color: #888; text-align: center; padding: 25px 0;'>" +

            "Корзина пуста 🛒" +

            "</p>";





        if (cartFooter) {

            cartFooter.style.display =

                "none";

        }





        if (cartTotalEl) {

            cartTotalEl.innerText =

                "0 ₽";

        }





        return;

    }





    if (cartFooter) {

        cartFooter.style.display =

            "block";

    }





    cart.forEach(function(item) {



        total += Number(

            item.price

        );





        var div =

            document.createElement(

                "div"

            );





        div.className =

            "cart-item";





        div.innerHTML =



            '<div class="cart-item-info">' +



                '<img src="' +

                    item.image +

                    '" ' +

                    'class="cart-item-img" ' +

                    'onerror="this.src=\'' +

                    FALLBACK_IMAGE +

                    '\'">' +



                '<div>' +



                    '<div class="cart-item-title">' +

                        item.name +

                    '</div>' +



                    '<div class="cart-item-sub">' +

                        'Размер: ' +

                        item.size +

                        ' | ' +

                        item.price +

                        ' ₽' +

                    '</div>' +



                '</div>' +



            '</div>' +



            '<button onclick="removeFromCart(\'' +

                item.id +

            '\')" ' +

            'class="cart-remove-btn" ' +

            'title="Удалить">' +
                '✕' +
            '</button>';


        cartListContainer.appendChild(
            div
        );

    });


    if (cartTotalEl) {

        cartTotalEl.innerText =
            total +
            " ₽";

    }

}


function openCartModal() {

    renderCartItems();


    var cartModal =
        document.getElementById(
            "cart-modal"
        );


    if (cartModal) {

        cartModal
            .classList
            .add("active");

    }

}


// ==================================================
// ОФОРМЛЕНИЕ ЗАКАЗА
// ==================================================

function checkoutOrder() {

    if (cart.length === 0) {

        alert(
            "Корзина пуста!"
        );

        return;
    }


    var consent =
        document.getElementById(
            "personal-data-consent"
        );


    if (
        !consent ||
        !consent.checked
    ) {

        alert(
            "Пожалуйста, подтвердите согласие на обработку персональных данных."
        );

        return;
    }


    var phone =
        document.getElementById(
            "cart-phone"
        ).value.trim();


    var tg =
        document.getElementById(
            "cart-tg"
        ).value.trim();


    var address =
        document.getElementById(
            "cart-address"
        ).value.trim();


    var payment =
        document.getElementById(
            "cart-payment"
        ).value;


    var comment =
        document.getElementById(
            "cart-comment"
        ).value.trim();


    if (
        !address ||
        !phone ||
        !tg
    ) {

        alert(
            "Пожалуйста, заполните телефон, Telegram и адрес доставки 🙏"
        );

        return;
    }


    var hasExchangeItems =
        document.getElementById(
            "has-exchange-items"
        ).checked;


    var checkoutBtn =
        document.getElementById(
            "checkout-btn"
        );


    checkoutBtn.disabled =
        true;


    checkoutBtn.innerText =
        "Отправка...";


    var payload = {

        phone: phone,

        tg: tg,

        address: address,

        payment: payment,

        comment:
            comment ||
            "Нет комментария",

        hasExchangeItems:
            hasExchangeItems,

        items: cart

    };


    fetch(API_URL, {

        method: "POST",

        body:
            JSON.stringify(
                payload
            )

    })

        .then(function() {

            alert(
                "Заказ успешно оформлен! Мы свяжемся с вами."
            );


            cart = [];


            saveCart();

            updateCartUI();


            document
                .getElementById(
                    "cart-modal"
                )
                .classList
                .remove("active");

        })

        .catch(function(err) {

            console.error(
                "Ошибка заказа:",
                err
            );


            alert(
                "Ошибка при отправке заказа."
            );

        })

        .finally(function() {

            checkoutBtn.disabled =
                false;


            checkoutBtn.innerText =
                "ОФОРМИТЬ ЗАКАЗ";

        });

}


// ==================================================
// СОБЫТИЯ МОДАЛОК
// ==================================================

function setupModalEvents() {

    var modal =
        document.getElementById(
            "product-modal"
        );


    var closeBtn =
        document.querySelector(
            "#product-modal .modal-close"
        );


    if (closeBtn) {

        closeBtn.onclick =
            function() {

                modal
                    .classList
                    .remove("active");

            };

    }


    if (modal) {

        modal.onclick =
            function(e) {

                if (
                    e.target === modal
                ) {

                    modal
                        .classList
                        .remove("active");

                }

            };

    }


    var cartModal =
        document.getElementById(
            "cart-modal"
        );


    var cartCloseBtn =
        document.getElementById(
            "cart-close"
        );


    var modalImg =
        document.getElementById(
            "modal-img"
        );


    if (modalImg) {

        modalImg.style.cursor =
            "zoom-in";


        modalImg.onclick =
            openFullscreenImage;

    }


    var cartTrigger =
        document.getElementById(
            "cart-trigger"
        );


    if (cartTrigger) {

        cartTrigger.onclick =
            openCartModal;

    }


    if (cartCloseBtn) {

        cartCloseBtn.onclick =
            function() {

                cartModal
                    .classList
                    .remove("active");

            };

    }


    if (cartModal) {

        cartModal.onclick =
            function(e) {

                if (
                    e.target === cartModal
                ) {

                    cartModal
                        .classList
                        .remove("active");

                }

            };

    }


    var fullscreenModal =
        document.getElementById(
            "fullscreen-image-modal"
        );


    var fullscreenClose =
        document.getElementById(
            "fullscreen-close"
        );


    if (fullscreenClose) {

        fullscreenClose.onclick =
            closeFullscreenImage;

    }


    if (fullscreenModal) {

        fullscreenModal.onclick =
            function(e) {

                if (
                    e.target ===
                    fullscreenModal
                ) {

                    closeFullscreenImage();

                }

            };

    }

}


// ==================================================
// ПРЕДЗАГРУЗКА ФОТОГРАФИЙ
// ==================================================

function preloadProductImages(products) {

    products.forEach(function(product) {

        var rawPhoto =
            String(
                product["ФОТО"] || ""
            ).trim();


        if (!rawPhoto) {
            return;
        }


        var photos =
            rawPhoto
                .split(",")
                .map(function(s) {
                    return s.trim();
                })
                .filter(Boolean);


        // Загружаем дополнительные фотографии
        // только товаров текущей партии

        for (
            var i = 1;
            i < photos.length;
            i++
        ) {

            var img =
                new Image();


            img.src =
                photos[i];

        }

    });

}