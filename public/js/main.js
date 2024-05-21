// Selectors

const toDoInput = document.querySelector('.todo-input');
const toDoBtn = document.querySelector('.todo-btn');
const toDoList = document.querySelector('.todo-list');
const standardTheme = document.querySelector('.standard-theme');
const lightTheme = document.querySelector('.light-theme');
const darkerTheme = document.querySelector('.darker-theme');


// Event Listeners

toDoBtn.addEventListener('click', addToDo);
toDoList.addEventListener('click', deletecheck);
document.addEventListener("DOMContentLoaded", getTodos);
standardTheme.addEventListener('click', () => changeTheme('standard'));
lightTheme.addEventListener('click', () => changeTheme('light'));
darkerTheme.addEventListener('click', () => changeTheme('darker'));

let savedTheme = localStorage.getItem('savedTheme');
savedTheme === null ?
    changeTheme('standard')
    : changeTheme(localStorage.getItem('savedTheme'));

// Functions;
function addToDo(event) {
    event.preventDefault();

    // toDo DIV;
    const toDoDiv = document.createElement("div");
    toDoDiv.classList.add('todo', `${savedTheme}-todo`);

    // Create LI
    const newToDo = document.createElement('li');
    if (toDoInput.value === '') {
            alert("You must write something!");
        } 
    else {
        // newToDo.innerText = "hey";
        newToDo.innerText = toDoInput.value;
        newToDo.classList.add('todo-item');
        newToDo.dataset.completed = false; 
        toDoDiv.appendChild(newToDo);

        // Adding to database;
        saveToDatabase(toDoInput.value);

        // check btn;
        const checked = document.createElement('button');
        checked.innerHTML = '<i class="fas fa-check"></i>';
        checked.classList.add('check-btn', `${savedTheme}-button`);
        checked.dataset.checked = false;
        checked.addEventListener('click', () => toggleCheck(toDoDiv));
        toDoDiv.appendChild(checked);
        // delete btn;
        const deleted = document.createElement('button');
        deleted.innerHTML = '<i class="fas fa-trash"></i>';
        deleted.classList.add('delete-btn', `${savedTheme}-button`);
        toDoDiv.appendChild(deleted);
        toDoList.appendChild(toDoDiv);

        toDoInput.value = '';
    }

}   


function deletecheck(event){

    const item = event.target;

    // delete
    if(item.classList[0] === 'delete-btn')
    {

        item.parentElement.classList.add("fall");


        removeFromDatabase(item.parentElement);

        item.parentElement.addEventListener('transitionend', function(){
            item.parentElement.remove();
        })
    }

    if(item.classList[0] === 'check-btn')
    {
        item.parentElement.classList.toggle("completed");
    }


}


// Saving to database:
function saveToDatabase(todo){
    fetch('/api/todos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json', 
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') 
        },
        body: JSON.stringify({ task: todo })
    })
    .then(response => response.json())
    .then(data => console.log('Success:', data))
    .catch((error) => {
        console.error('Error:', error);
    });
}

function removeFromDatabase(todo){
    const id = todo.dataset.id; 
    fetch(`/api/todos/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            console.log('Deleted:', id);
            todo.remove(); 
        } else {
            console.error('Failed to delete:', response.status);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function toggleCheck(todoElement) {
    const id = todoElement.dataset.id;
    const currentStatus = todoElement.dataset.completed === "true";
    const newStatus = !currentStatus;

    fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({ completed: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Update success:', data);
        todoElement.dataset.completed = newStatus ? "true" : "false";
        todoElement.classList.toggle("completed", newStatus);
    })
    .catch(error => {
        console.error('Error updating status:', error);
    });
}

function getTodos() {
    fetch('/api/todos')
    .then(response => response.json())
    .then(todos => {
        todos.forEach(function(todo) {
            // toDo DIV;
            const toDoDiv = document.createElement("div");
            toDoDiv.classList.add("todo", `${savedTheme}-todo`);
            toDoDiv.dataset.id = todo.id; 

            // Create LI
            const newToDo = document.createElement('li');
            
            newToDo.innerText = todo.task;
            newToDo.classList.add('todo-item');
            newToDo.dataset.completed = todo.completed ? "true" : "false"; 
            if (todo.completed) {
                newToDo.classList.add('completed'); 
            }
            toDoDiv.appendChild(newToDo);

            // check btn;
            const checked = document.createElement('button');
            checked.innerHTML = '<i class="fas fa-check"></i>';
            checked.classList.add("check-btn", `${savedTheme}-button`);
            checked.dataset.checked = todo.completed ? "true" : "false"; 
            checked.addEventListener('click', () => toggleCheck(toDoDiv));
            toDoDiv.appendChild(checked);
            // delete btn;
            const deleted = document.createElement('button');
            deleted.innerHTML = '<i class="fas fa-trash"></i>';
            deleted.classList.add("delete-btn", `${savedTheme}-button`);
            deleted.addEventListener('click', () => removeFromDatabase(toDoDiv)); 
            toDoDiv.appendChild(deleted);

            toDoList.appendChild(toDoDiv);
        });
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}


function changeTheme(color) {
    localStorage.setItem('savedTheme', color);
    savedTheme = localStorage.getItem('savedTheme');

    document.body.className = color;
    color === 'darker' ? 
        document.getElementById('title').classList.add('darker-title')
        : document.getElementById('title').classList.remove('darker-title');

    document.querySelector('input').className = `${color}-input`;
    document.querySelectorAll('.todo').forEach(todo => {
        Array.from(todo.classList).some(item => item === 'completed') ? 
            todo.className = `todo ${color}-todo completed`
            : todo.className = `todo ${color}-todo`;
    });
    document.querySelectorAll('button').forEach(button => {
        Array.from(button.classList).some(item => {
            if (item === 'check-btn') {
              button.className = `check-btn ${color}-button`;  
            } else if (item === 'delete-btn') {
                button.className = `delete-btn ${color}-button`; 
            } else if (item === 'todo-btn') {
                button.className = `todo-btn ${color}-button`;
            }
        });
    });
}
