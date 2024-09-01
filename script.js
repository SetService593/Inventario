document.addEventListener('DOMContentLoaded', () => {
    let products = [];
    let sales = [];
    let withdrawals = [];
    let totalProfit = 0;
    let totalBalance = 0;
    let totalPending = 0;
    let editIndex = -1; // Índice del producto que se está editando

    function loadData() {
        if (localStorage.getItem('products')) {
            products = JSON.parse(localStorage.getItem('products'));
            renderInventory();
            populateProductSelect();
        }

        if (localStorage.getItem('sales')) {
            sales = JSON.parse(localStorage.getItem('sales'));
            renderSales();
        }

        if (localStorage.getItem('withdrawals')) {
            withdrawals = JSON.parse(localStorage.getItem('withdrawals'));
            renderWithdrawals();
        }

        totalProfit = parseFloat(localStorage.getItem('totalProfit')) || 0;
        totalBalance = parseFloat(localStorage.getItem('totalBalance')) || 0;
        totalPending = parseFloat(localStorage.getItem('totalPending')) || 0;

        updateTotals();
    }

    function saveData() {
        localStorage.setItem('products', JSON.stringify(products));
        localStorage.setItem('sales', JSON.stringify(sales));
        localStorage.setItem('withdrawals', JSON.stringify(withdrawals));
        localStorage.setItem('totalProfit', totalProfit.toString());
        localStorage.setItem('totalBalance', totalBalance.toString());
        localStorage.setItem('totalPending', totalPending.toString());
    }

    function resetData() {
        products = [];
        sales = [];
        withdrawals = [];
        totalProfit = 0;
        totalBalance = 0;
        totalPending = 0;

        localStorage.removeItem('products');
        localStorage.removeItem('sales');
        localStorage.removeItem('withdrawals');
        localStorage.removeItem('totalProfit');
        localStorage.removeItem('totalBalance');
        localStorage.removeItem('totalPending');

        renderInventory();
        renderSales();
        renderWithdrawals();
        updateTotals();
    }

    document.getElementById('reset-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const password = document.getElementById('reset-password').value;

        if (password === '0000') {
            if (confirm("¿Estás seguro de que quieres reiniciar todos los datos? Esta acción no se puede deshacer.")) {
                resetData();
                alert("Datos reiniciados con éxito.");
            }
        } else {
            alert("Contraseña incorrecta. Por favor, ingrese la contraseña correcta.");
        }

        this.reset();
    });

    function renderInventory() {
        const inventoryTableBody = document.querySelector('#inventory-table tbody');
        if (inventoryTableBody) {
            inventoryTableBody.innerHTML = '';
            products.forEach((product, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.name}</td>
                    <td>${product.purchasePrice.toFixed(2)}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>${product.stock}</td>
                    <td>
                        <button onclick="editProduct(${index})">Editar</button>
                        <button onclick="deleteProduct(${index})">Eliminar</button>
                    </td>
                `;
                inventoryTableBody.appendChild(row);
            });
        }
    }

    function renderSales() {
        const salesTableBody = document.querySelector('#sales-table tbody');
        if (salesTableBody) {
            salesTableBody.innerHTML = '';
            sales.forEach((sale, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${sale.productName}</td>
                    <td>${sale.customerName}</td>
                    <td>${sale.customerPhone}</td>
                    <td>${sale.date}</td>
                    <td>${sale.paymentType}</td>
                    <td>${sale.quantity}</td>
                    <td>${sale.amount.toFixed(2)}</td>
                    <td>${sale.profit.toFixed(2)}</td>
                    <td>${sale.isPaid ? 'Pagado' : 'Pendiente'}</td>
                    <td>
                        ${!sale.isPaid && sale.paymentType === 'credit' ? `<button onclick="registerPayment(${index})">Marcar como Pagado</button>` : ''}
                    </td>
                `;
                salesTableBody.appendChild(row);
            });
        }
    }

    function renderWithdrawals() {
        const withdrawalsTableBody = document.querySelector('#withdrawals-table tbody');
        if (withdrawalsTableBody) {
            withdrawalsTableBody.innerHTML = '';
            withdrawals.forEach(withdrawal => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${withdrawal.date}</td>
                    <td>${withdrawal.amount.toFixed(2)}</td>
                `;
                withdrawalsTableBody.appendChild(row);
            });
        }
    }

    function populateProductSelect() {
        const productSelect = document.getElementById('product-select');
        if (productSelect) {
            productSelect.innerHTML = '';
            products.forEach((product, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = product.name;
                productSelect.appendChild(option);
            });
        }
    }

    document.getElementById('product-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('product-name').value;
        const purchasePrice = parseFloat(document.getElementById('product-purchase-price').value) || 0;
        const price = parseFloat(document.getElementById('product-price').value) || 0;
        const stock = parseInt(document.getElementById('product-stock').value) || 0;

        if (editIndex === -1) {
            products.push({ name, purchasePrice, price, stock });
        } else {
            products[editIndex] = { name, purchasePrice, price, stock };
            editIndex = -1;
        }

        renderInventory();
        populateProductSelect();
        saveData();
        this.reset();
    });

    window.editProduct = function(index) {
        const product = products[index];
        if (product) {
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-purchase-price').value = product.purchasePrice;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-stock').value = product.stock;
            editIndex = index;
        }
    };

    window.deleteProduct = function(index) {
        products.splice(index, 1);
        renderInventory();
        populateProductSelect();
        saveData();
    };

    document.getElementById('sales-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const productIndex = parseInt(document.getElementById('product-select').value) || 0;
        const product = products[productIndex];
        const customerName = document.getElementById('customer-name').value;
        const customerPhone = document.getElementById('customer-phone').value;
        const date = document.getElementById('sale-date').value;
        const paymentType = document.getElementById('payment-type').value;
        const quantity = parseInt(document.getElementById('sale-quantity').value) || 0;

        if (!product || quantity > product.stock) {
            alert("Cantidad de producto no disponible.");
            return;
        }

        const amount = quantity * product.price;
        const profit = quantity * (product.price - product.purchasePrice);

        sales.push({
            productName: product.name,
            customerName,
            customerPhone,
            date,
            paymentType,
            quantity,
            amount,
            profit,
            isPaid: paymentType === 'cash'
        });

        product.stock -= quantity;
        totalProfit += profit;
        if (paymentType === 'credit') {
            totalPending += amount;
        } else {
            totalBalance += amount;
        }

        updatePendingTotal();
        renderInventory();
        renderSales();
        updateTotals();
        saveData();
        this.reset();
    });

    window.registerPayment = function(index) {
        const sale = sales[index];
        if (sale && sale.paymentType === 'credit' && !sale.isPaid) {
            sale.isPaid = true;
            sale.paymentDate = new Date().toLocaleDateString();
            totalBalance += sale.amount;
            totalPending -= sale.amount;
            renderSales();
            updateTotals();
            saveData();
        }
    };

    document.getElementById('withdrawals-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const withdrawalAmount = parseFloat(document.getElementById('withdrawal-amount').value) || 0;

        if (withdrawalAmount > totalBalance) {
            alert("El monto del retiro excede el saldo disponible.");
            return;
        }

        withdrawals.push({
            date: new Date().toLocaleDateString(),
            amount: withdrawalAmount
        });

        totalBalance -= withdrawalAmount;
        renderWithdrawals();
        updateTotals();
        saveData();
        this.reset();
    });

    function updatePendingTotal() {
        totalPending = sales.reduce((total, sale) => !sale.isPaid ? total + sale.amount : total, 0);
        document.getElementById('pending-total').innerText = `Total Pendiente: $${totalPending.toFixed(2)}`;
    }

    function updateTotals() {
        document.getElementById('total-profit').innerText = `Ganancia Total: $${totalProfit.toFixed(2)}`;
        document.getElementById('total-balance').innerText = `Saldo Disponible: $${totalBalance.toFixed(2)}`;
        document.getElementById('pending-total').innerText = `Total Pendiente: $${totalPending.toFixed(2)}`;
    }

    loadData();
});
function showAlert(message, type) {
    const alertBox = document.createElement('div');
    alertBox.className = `alert ${type}`;
    alertBox.textContent = message;
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 3000);
}