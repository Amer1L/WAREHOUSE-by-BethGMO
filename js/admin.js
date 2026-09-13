var API_URL = "https://script.google.com/macros/s/AKfycbyojAy2H8xpT74OARTBWDv2SYUDINOWjzkRFzacfWIxE2AgY46AcFrnPItSqZWKls-D/exec";

var productsContainer = document.getElementById("admin-products");
var statusElement = document.getElementById("admin-status");

document.addEventListener("DOMContentLoaded", function() {

    loadProducts();

});


function loadProducts() {

    statusElement.textContent = "ЗАГРУЗКА ТОВАРОВ...";

    fetch(API_URL)

        .then(function(response) {

            if (!response.ok) {
                throw new Error("HTTP error: " + response.status);
            }

            return response.json();

        })

        .then(function(products) {

            console.log("ADMIN: товары получены", products);

            renderProducts(products);

            statusElement.textContent =
                "ТОВАРОВ: " + products.length;

        })

        .catch(function(error) {

            console.error("ADMIN: ошибка загрузки", error);

            statusElement.textContent =
                "ОШИБКА ЗАГРУЗКИ ТОВАРОВ";

        });

}


function renderProducts(products) {

    productsContainer.innerHTML = "";

    products.sort(function(a, b) {

        return Number(a["ПОРЯДОК"] || 999999) -
               Number(b["ПОРЯДОК"] || 999999);

    });


    products.forEach(function(product, index) {

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

        var status =
            product["СТАТУС"] ||
            "";

        var order =
            product["ПОРЯДОК"] ||
            "—";


        var item = document.createElement("div");

        item.className = "admin-product";

        item.innerHTML = `
            <div class="admin-product-number">
                ${index + 1}
            </div>

            <div class="admin-product-info">

                <div class="admin-product-name">
                    ${name}
                </div>

                <div class="admin-product-details">
                    ID: ${id}
                    · ${price} ₽
                    · Порядок: ${order}
                </div>

                <div class="admin-product-status">
                    ${status}
                </div>

            </div>

            <div class="admin-product-buttons">

                <button disabled>
                    ↑
                </button>

                <button disabled>
                    ↓
                </button>

            </div>
        `;

        productsContainer.appendChild(item);

    });

}