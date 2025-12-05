const searchButton = document.getElementById('searchButton');
const documentTypeSelect = document.getElementById('documentType');
const exportButton = document.getElementById('exportButton');
const documentNumberInput = document.getElementById('documentNumber');
const messageContainer = document.getElementById('messageContainer');
const clientDetails = document.getElementById('clientDetails');
const purchasesContainer = document.getElementById('purchasesContainer');

// 👇 Ajusta esto al puerto real de tu API .NET
const API_BASE_URL = 'https://localhost:44304';

function showMessage(text, type = 'success') {
  messageContainer.innerHTML = '';
  if (!text) return;
  const div = document.createElement('div');
  div.classList.add('message');
  div.classList.add(type === 'error' ? 'error' : 'success');
  div.textContent = text;
  messageContainer.appendChild(div);
}

function clearResults() {
  clientDetails.innerHTML = '<p class="no-data">No hay información cargada. Realiza una búsqueda para ver los datos del cliente.</p>';
  purchasesContainer.innerHTML = '<p class="no-data">No hay compras para mostrar.</p>';
}

async function searchClient() {
  const documentType = documentTypeSelect.value;
  const documentNumber = documentNumberInput.value.trim();
  if (!documentNumber) {
    showMessage('Por favor ingresa el número de documento.', 'error');
    return;
  }

  clearResults();
  showMessage('Buscando cliente...', 'success');
  searchButton.disabled = true;
  exportButton.disabled = true;

  try {
    const url = `${API_BASE_URL}/api/client/search/?document_type=${encodeURIComponent(documentType)}&document_number=${encodeURIComponent(documentNumber)}`;
    console.log('URL llamada:', url);
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        showMessage('Cliente no encontrado.', 'error');
      } else if (response.status === 400) {
        const data = await response.json().catch(() => null);
        const msg = data && data.detail ? data.detail : 'Parámetros inválidos.';
        showMessage(msg, 'error');
      } else {
        showMessage('Error al consultar el cliente. Intenta nuevamente.', 'error');
      }
      return;
    }

    const data = await response.json();
    console.log('Respuesta backend:', data);
    renderClient(data);
    renderPurchases(data.purchases || []);
    showMessage('Cliente encontrado correctamente.', 'success');
    exportButton.disabled = false;
  } catch (error) {
    console.error(error);
    showMessage('Ocurrió un error de comunicación con el servidor.', 'error');
  } finally {
    searchButton.disabled = false;
  }
}

// ⬇⬇⬇ AQUÍ ESTABA EL PROBLEMA: nombres de propiedades ⬇⬇⬇
function renderClient(client) {
  clientDetails.innerHTML = `
    <p><strong>Tipo de documento:</strong> 
      <span class="field-value">
        ${client.documentType.code} - ${client.documentType.name}
      </span>
    </p>
    <p><strong>Número de documento:</strong> 
      <span class="field-value">${client.documentNumber}</span>
    </p>
    <p><strong>Nombre:</strong> 
      <span class="field-value">${client.firstName} ${client.lastName}</span>
    </p>
    <p><strong>Correo:</strong> 
      <span class="field-value">${client.email}</span>
    </p>
    <p><strong>Teléfono:</strong> 
      <span class="field-value">${client.phone}</span>
    </p>
  `;
}

function renderPurchases(purchases) {
  if (!purchases || purchases.length === 0) {
    purchasesContainer.innerHTML = '<p class="no-data">El cliente no tiene compras registradas.</p>';
    return;
  }
  let html = '<table><thead><tr>';
  html += '<th>Fecha</th><th>Monto</th><th>Descripción</th><th>Número de orden</th>';
  html += '</tr></thead><tbody>';

  purchases.forEach(p => {
    // purchaseDate, amount, description, orderNumber vienen tal cual de .NET
    const date = p.purchaseDate?.substring(0, 10) || ''; // yyyy-MM-dd
    html += `
      <tr>
        <td>${date}</td>
        <td>${p.amount}</td>
        <td>${p.description || ''}</td>
        <td>${p.orderNumber || ''}</td>
      </tr>
    `;
  });
  html += '</tbody></table>';
  purchasesContainer.innerHTML = html;
}

function exportClient() {
  const documentType = documentTypeSelect.value;
  const documentNumber = documentNumberInput.value.trim();
  if (!documentNumber) {
    showMessage('Primero debes ingresar un número de documento y buscar al cliente.', 'error');
    return;
  }
  const url = `${API_BASE_URL}/api/client/export/?document_type=${encodeURIComponent(documentType)}&document_number=${encodeURIComponent(documentNumber)}`;
  window.open(url, '_blank');
}

searchButton.addEventListener('click', searchClient);
exportButton.addEventListener('click', exportClient);
documentNumberInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    searchClient();
  }
});
