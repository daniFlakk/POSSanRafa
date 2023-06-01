import { PrintStats, PrintPie, Table, RefreshTable } from './table.js'

const SelectedItemname = document.getElementById('selected-item')
let PieGraphQty
let PieChart = null

const InventoryTable = new Table(document.getElementById('inventory'), ['Productos', 'Clase', 'Precio', 'Cantidad'])

async function LoadInventory() {
  const response = await fetch('/data/inventory')
  const data = await response.json()

  if (RefreshTable(InventoryTable.data, data)) {
    const totalCost = document.getElementById('total-cost')
    const totalQuantity = document.getElementById('total-quantity')

    InventoryTable.fillTable(data)
    PrintStats(totalCost, totalQuantity, data)
    InventoryTable.enableSelection(SelectedItemname)

    PieGraphQty = null
    PieGraphQty = document.getElementById('quantity')

    if (PieChart) {
      PieChart.destroy()
    }
    PieChart = PrintPie(PieGraphQty, data)
  } else {
    console.log('not refreshed')
  }
}

LoadInventory()
setInterval(LoadInventory, 1600)

// main button events
const LabelHeadings = document.querySelector('thead')
const PopUpContainer = document.querySelector('.popup-container')

const AddPopUp = document.querySelector('.add-box')
const EditPopUp = document.querySelector('.edit-box')
const DeletePopUp = document.querySelector('.delete-box')

const AddButton = document.querySelector('.add')
const EditButton = document.querySelector('.edit')
const DeleteButton = document.querySelector('.delete')

function DisplayPopUp(ShowPopUpBox) {
  PopUpContainer.style.display = 'flex'
  LabelHeadings.style.display = 'none'
  PieGraphQty.style.display = 'none'
  ShowPopUpBox.style.display = 'block'
}

function ClosePopUp(ShowPopUpBox) {
  PopUpContainer.style.display = 'none'
  LabelHeadings.style.display = ''
  PieGraphQty.style.display = 'block'
  ShowPopUpBox.style.display = 'none'

  InventoryTable.selection = null
  SelectedItemname.value = 'None'

  try {
    InventoryTable.trSelected.style.backgroundColor = ''
    InventoryTable.trSelected.style.color = ''
    InventoryTable.trSelected.style.outline = ''
  } catch (err) {
    console.log('ClosePopUp() : No rows selected yet to be clear')
  }
}

AddButton.addEventListener('click', event => {
  DisplayPopUp(AddPopUp)
})

EditButton.addEventListener('click', event => {
  if (InventoryTable.selection) {
    const ItemNameInput = EditPopUp.querySelector('#edit-itemname')
    const ClassInput = EditPopUp.querySelector('#edit-class')
    const QuantityInput = EditPopUp.querySelector('#edit-quantity')

    ItemNameInput.value = InventoryTable.selection.itemname
    ClassInput.value = InventoryTable.selection.class
    QuantityInput.value = InventoryTable.selection.quantity

    // Formatear el precio
    const formattedPrice = formatCurrency(parseFloat(InventoryTable.selection.price))
    const PriceInput = EditPopUp.querySelector('#edit-price')
    PriceInput.value = formattedPrice

    DisplayPopUp(EditPopUp)
  } else {
    window.alert('Realiza primero la selección de un artículo en la lista de inventario')
  }
})

DeleteButton.addEventListener('click', event => {
  if (InventoryTable.selection) {
    const ItemName = document.getElementById('del-name')
    ItemName.innerText = `¿Eliminar '${InventoryTable.selection.itemname}' del inventario?`
    DisplayPopUp(DeletePopUp)
  } else {
    window.alert('Realiza primero la selección de un artículo en la lista de inventario')
  }
})

// popup action buttons

const addConfirm = document.querySelector('.add0')
const addCancle = document.querySelector('.add1')

const editConfirm = document.querySelector('.edit0')
const editCancle = document.querySelector('.edit1')

const deleteConfirm = document.querySelector('.delete0')
const deleteCancle = document.querySelector('.delete1')

addConfirm.addEventListener('click', async () => {
  const ItemNameInput = AddPopUp.querySelector('#add-itemname')
  const ClassInput = AddPopUp.querySelector('#add-class')
  const PriceInput = AddPopUp.querySelector('#add-price')
  const QuantityInput = AddPopUp.querySelector('#add-quantity')

  if (ItemNameInput.value === '') {
    window.alert('Fill Up Item Name')
  } else if (ClassInput.value === '') {
    window.alert('Fill Up Class')
  } else if (PriceInput.value === '') {
    window.alert('Fill Up Price')
  } else if (QuantityInput.value === '') {
    window.alert('Fill Up Quantity')
  } else {
    // requirements meet
    try {
      // send post request
      const response = await fetch('/data/inventory', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'post',
        body: JSON.stringify({
          itemname: ItemNameInput.value,
          class: ClassInput.value,
          price: PriceInput.value,
          quantity: QuantityInput.value
        })
      })

      const data = await response.json()
      console.log('ADD', data)

      // clear fields
      ItemNameInput.value = ''
      ClassInput.value = ''
      PriceInput.value = ''
      QuantityInput.value = ''

      // refresh the list
      LoadInventory()

      // close popup window
      ClosePopUp(AddPopUp)
    } catch (error) {
      console.error('ERROR in : Add>Confirm>fetch()\n', error)
    }
  }
})

addCancle.addEventListener('click', event => {
  ClosePopUp(AddPopUp)
})

editConfirm.addEventListener('click', async () => {
  const ItemNameInput = EditPopUp.querySelector('#edit-itemname')
  const ClassInput = EditPopUp.querySelector('#edit-class')
  const PriceInput = EditPopUp.querySelector('#edit-price')
  const QuantityInput = EditPopUp.querySelector('#edit-quantity')

  if (ItemNameInput.value === '') {
    window.alert('Llene el campo nombre')
  } else if (ClassInput.value === '') {
    window.alert('Llene el campo clase')
  } else if (PriceInput.value === '') {
    window.alert('Llene el campo valor')
  } else if (QuantityInput.value === '') {
    window.alert('Llene el campo cantidad')
  } else { // requirements meet
    try {
      // send put request
      const response = await fetch(`/data/inventory/${InventoryTable.selection.itemname.replaceAll(' ', '&+')}`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'put',
        body: JSON.stringify({
          itemname: ItemNameInput.value,
          class: ClassInput.value,
          price: PriceInput.value,
          quantity: QuantityInput.value
        })
      })

      const data = await response.json()
      console.log('EDIT', data)

      // clear fields
      ItemNameInput.value = ''
      ClassInput.value = ''
      PriceInput.value = ''
      QuantityInput.value = ''

      // refresh the list
      LoadInventory()

      // close popup window
      ClosePopUp(EditPopUp)
    } catch (error) {
      console.error('ERROR in : Edit>Confirm>fetch()\n', error)
    }
  }
})

editCancle.addEventListener('click', event => {
  ClosePopUp(EditPopUp)
})

deleteConfirm.addEventListener('click', async () => {
  try {
    // send delete request
    const response = await fetch(`/data/inventory/${InventoryTable.selection.itemname.replaceAll(' ', '&+')}`, {
      method: 'delete'
    })

    const data = await response.json()
    console.log('DELETE', data)

    // refresh the list
    LoadInventory()

    // close popup window
    ClosePopUp(DeletePopUp)
  } catch (error) {
    console.error('ERROR in : Delete>Confirm>fetch()\n', error)
  }
})

deleteCancle.addEventListener('click', event => {
  ClosePopUp(DeletePopUp)
})

// function to format currency
function formatCurrency(value) {
  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  })
  return formatter.format(value)
}
