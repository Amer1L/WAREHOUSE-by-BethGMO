var API_URL = "https://script.google.com/macros/s/AKfycbyojAy2H8xpT74OARTBWDv2SYUDINOWjzkRFzacfWIxE2AgY46AcFrnPItSqZWKls-D/exec";

var productsContainer = document.getElementById("admin-products");
var statusElement = document.getElementById("admin-status");

var adminPassword = ""

var adminProducts = [];
var orderChanged = false;

var saveOrderButton =
    document.getElementById("save-order-button");




document.addEventListener("DOMContentLoaded", function() {
    askPassword();
});

function askPassword() {
    var password = prompt("Введите пароль администратора:");

    if (!password) {
        statusElement.textContent = "ДОСТУП ОТМЕНЁН";
        return;
    }

    adminPassword = password;

    loadProducts(adminPassword);
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
                    
            adminProducts = data.products;
            orderChanged = false;
                    
            renderProducts(adminProducts);

            saveOrderButton.disabled = true;


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

    var currentIndex = adminProducts.findIndex(function(product) {
        return String(product.id) === String(rowId);
    });

    if (currentIndex === -1) {
        return;
    }

    var targetIndex =
        direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= adminProducts.length) {
        return;
    }

    // Меняем товары местами
    var temp = adminProducts[currentIndex];

    adminProducts[currentIndex] =
        adminProducts[targetIndex];

    adminProducts[targetIndex] = temp;

    // Обновляем порядок прямо в браузере
    adminProducts.forEach(function(product, index) {
        product["ПОРЯДОК"] = index + 1;
    });

    orderChanged = true;

    renderProducts(adminProducts);

    saveOrderButton.disabled = false;

    statusElement.textContent =
        "ЕСТЬ НЕСОХРАНЁННЫЕ ИЗМЕНЕНИЯ";
}



function saveOrder() {

    if (!orderChanged) {
        statusElement.textContent = "ИЗМЕНЕНИЙ НЕТ";
        return;
    }

    statusElement.textContent =
        "СОХРАНЕНИЕ ПОРЯДКА...";

    var orderData = adminProducts.map(function(product, index) {
        return {
            rowId: product.id,
            order: index + 1
        };
    });

    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
            action: "adminSaveOrder",
            password: adminPassword,
            products: orderData
        })
    })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {

            if (!data.success) {
                statusElement.textContent =
                    data.error || "ОШИБКА СОХРАНЕНИЯ";
                return;
            }

            orderChanged = false;

            saveOrderButton.disabled = true;

            statusElement.textContent =
                "ПОРЯДОК СОХРАНЁН ✓";
        })
        .catch(function(error) {

            console.error(
                "ADMIN: ошибка сохранения порядка",
                error
            );

            statusElement.textContent =
                "ОШИБКА ПОДКЛЮЧЕНИЯ";
        });
}
