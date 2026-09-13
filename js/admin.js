var API_URL = "https://script.google.com/macros/s/AKfycbyojAy2H8xpT74OARTBWDv2SYUDINOWjzkRFzacfWIxE2AgY46AcFrnPItSqZWKls-D/exec";

var productsContainer = document.getElementById("admin-products");
var statusElement = document.getElementById("admin-status");

var adminPassword = ""

document.addEventListener("DOMContentLoaded", function() {
    askPassword();
});

function askPassword() {
    var password = prompt("Введите пароль администратора:");

    if (!password) {
        statusElement.textContent = "ДОСТУП ОТМЕНЁН";
        return;
    }

    loadProducts(password);
}

function loadProducts(password) {
    statusElement.textContent = "ПРОВЕРКА ДОСТУПА...";

    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
            action: "adminGetProducts",
            password: password
        })
    })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {

            if (!data.success) {
                statusElement.textContent = data.error || "ДОСТУП ЗАПРЕЩЁН";
                return;
            }

            console.log("ADMIN: товары получены", data.products);

            renderProducts(data.products);

            statusElement.textContent =
                "ТОВАРОВ: " + data.products.length;
        })
        .catch(function(error) {
            console.error("ADMIN: ошибка", error);
            statusElement.textContent = "ОШИБКА ПОДКЛЮЧЕНИЯ";
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

        var photo =
            product["ФОТО"] ||
            "";

        if (photo) {
            photo = String(photo)
                .split(",")[0]
                .trim();
        }

        var item = document.createElement("div");

        item.className = "admin-product";

        item.innerHTML = `
            <div class="admin-product-number">
                ${index + 1}
            </div>

            <div class="admin-product-photo">
                ${
                    photo
                    ? `<img src="${photo}" alt="">`
                    : ""
                }
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

                <button
                    ${index === 0 ? "disabled" : ""}
                    onclick="moveProduct('${product.id}', 'up')">
                    ↑
                </button>

                <button
                    ${index === products.length - 1 ? "disabled" : ""}
                    onclick="moveProduct('${product.id}', 'down')">
                    ↓
                </button>

            </div>
        `;

        productsContainer.appendChild(item);
    });
}

function moveProduct(rowId, direction) {

    var password = prompt("Введите пароль администратора:");

    if (!password) {
        return;
    }

    statusElement.textContent = "ПЕРЕМЕЩЕНИЕ...";

    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
            action: "adminMoveProduct",
            rowId: rowId,
            direction: direction,
            password: password
        })
    })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {

            if (!data.success) {
                statusElement.textContent =
                    data.error || "ОШИБКА ПЕРЕМЕЩЕНИЯ";
                return;
            }

            statusElement.textContent = "ГОТОВО";

            loadProducts(password);
        })
        .catch(function(error) {
            console.error("ADMIN: ошибка перемещения", error);

            statusElement.textContent =
                "ОШИБКА ПОДКЛЮЧЕНИЯ";
        });
}