class Todo {
  constructor({
    title = "Todo App",
    data = [],
    onAdded = () => {},
    onDeleted = () => {},
    onStatusChanged = () => {} } =
  {}) {
    this.nodes = {};
    this.title = title;
    this.data = data;
    this.filteredData = data;
    this.count = data.length;
    this.addTask = this.addTask.bind(this);
    this.deleteTask = this.deleteTask.bind(this);
    this.toggleStatus = this.toggleStatus.bind(this);
    this.filterData = this.filterData.bind(this);
    this.onAdded = onAdded;
    this.onDeleted = onDeleted;
    this.onStatusChanged = onStatusChanged;

    this.filterTypes = [
    {
      name: "All",
      queryParam: null,
      queryValue: null,
      active: true },

    {
      name: "Active",
      queryParam: "completed",
      queryValue: false,
      active: false },

    {
      name: "Completed",
      queryParam: "completed",
      queryValue: true,
      active: false }];



    this.elementDefaults = {
      type: "div",
      markup: "",
      container: document.body,
      attributes: {},
      events: {} };

  }

  elementCreator(options) {
    const config = { ...this.elementDefaults, ...options };
    const elementNode = document.createElement(config.type);

    Object.keys(config.attributes).forEach(a => {
      config.attributes[a] !== null &&
      elementNode.setAttribute(a, config.attributes[a]);
    });

    elementNode.innerHTML = config.markup;
    config.container.append(elementNode);

    Object.keys(config.events).forEach(e => {
      this.eventBinder(
      elementNode,
      e,
      config.events[e].action,
      config.events[e].api);

    });

    return elementNode;
  }

  updateCount() {
    this.count = this.data.length;
    this.nodes.count.innerHTML =
    this.count > 1 ? `${this.count} tasks` : `${this.count} task`;
  }

  eventBinder(el, event, action, api = false) {
    el.addEventListener(event, e => {
      api ? action(e) : action();
    });
  }

  emptyListUI(message = "Not found a task") {
    this.nodes.list.innerHTML = "";
    this.nodes.emptyList = this.elementCreator({
      markup: message,
      attributes: {
        class: "task-empty" },

      container: this.nodes.list });

  }

  addTask({
    name = `New task #${new Date().getUTCMilliseconds()}`,
    completed = false } =
  {}) {
    const inputValue = this.nodes.input.value.trim();
    const taskName = inputValue.length > 0 ? inputValue : name;
    const newTask = {
      task: taskName,
      completed: completed ? 1 : 0
    };

    this.nodes.input.value = "";

    fetch('/api/todos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify(newTask)
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.id) {
            this.data.push({
                id: data.id,
                name: data.task,
                completed: data.completed,
                created_at: data.created_at,
                updated_at: data.updated_at
            }); 
            this.listUI(this.data);
            this.onAdded(data);
            this.updateCount();
            this.filterData();
        } else {
            throw new Error('Invalid data returned from server');
        }
    })
    .catch(error => console.error('Error:', error));
  }

  filterData(e, param = null, value = null) {
    const attrParam = e ? e.target.getAttribute("data-param") : null;
    const attrValue = e ? e.target.getAttribute("data-value") : null;

    const queryParam = param ? param : attrParam;
    let queryValue = value !== null ? value : attrValue;

    // Konversi queryValue ke tipe yang sesuai jika queryParam adalah 'completed'
    if (queryParam === "completed") {
        queryValue = queryValue === "true" ? 1 : (queryValue === "false" ? 0 : queryValue);
    }

    this.filteredData = this.data.filter(task => {
        if (queryParam === null) {
            return true; // Jika tidak ada queryParam, tampilkan semua data
        } else {
            return task[queryParam] === queryValue;
        }
    });

    this.listUI(this.filteredData);

    const filterTypes = this.filterTypes.map(filter => {
        filter.active = String(filter.queryParam) === String(queryParam) &&
                        String(filter.queryValue) === String(queryValue);
        return filter;
    });

    this.filterUI(filterTypes);
    this.filterTypes = filterTypes;
  }

  toggleStatus(e, id = null) {
    const taskId = id ? id : Number(e.target.getAttribute("data-id"));
    const task = this.data.find(task => task.id === taskId);
    const newStatus = !task.completed; 

    // Update task in the local state
    const updatedData = this.data.map(task => {
        if (task.id === taskId) {
            task.completed = newStatus ? 1 : 0; 
        }
        return task;
    });

    this.listUI(updatedData);
    this.data = updatedData;
    this.onStatusChanged(taskId);
    this.filterData();

    this.updateTaskInDatabase(taskId, newStatus);
  }

  updateTaskInDatabase(taskId, newStatus) {
    fetch(`/api/todos/${taskId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ completed: newStatus ? 1 : 0 }) 
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Status updated:', data);
    })
    .catch(error => console.error('Error updating status:', error));
  }

  deleteTask(e, id = null) {
    const taskId = id ? id : Number(e.target.getAttribute("data-id"));

    fetch(`/api/todos/${taskId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        // Hapus task dari state lokal setelah berhasil dihapus dari database
        const updatedData = this.data.filter(task => task.id !== taskId);
        this.listUI(updatedData);
        this.data = updatedData;
        this.onDeleted(taskId);
        this.updateCount();
        this.filterData();
    })
    .catch(error => console.error('Error deleting task:', error));
  }

  generalUI() {
    this.nodes.app = this.elementCreator({
      attributes: {
        class: "app" } });



    this.nodes.header = this.elementCreator({
      attributes: {
        class: "task-header" },

      container: this.nodes.app });


    this.nodes.title = this.elementCreator({
      type: "h1",
      markup: this.title,
      attributes: {
        class: "task-header-title" },

      container: this.nodes.header });


    this.nodes.list = this.elementCreator({
      attributes: {
        class: "task-list" },

      container: this.nodes.app });


    this.nodes.tools = this.elementCreator({
      attributes: {
        class: "task-tools" },

      container: this.nodes.header });


    this.nodes.form = this.elementCreator({
      type: "form",
      attributes: {
        class: "task-form" },

      events: {
        submit: { action: e => e.preventDefault(), api: true } },

      container: this.nodes.header });


    this.nodes.count = this.elementCreator({
      markup: this.count > 1 ? `${this.count} tasks` : `${this.count} task`,
      attributes: {
        class: "task-count" },

      container: this.nodes.tools });


    this.nodes.filters = this.elementCreator({
      attributes: {
        class: "task-filters" },

      container: this.nodes.tools });

  }

  formUI() {
    this.nodes.input = this.elementCreator({
      type: "input",
      attributes: {
        class: "task-input",
        placeholder: "Add a new task...",
        autofocus: "true" },

      container: this.nodes.form });


    this.nodes.button = this.elementCreator({
      type: "button",
      markup: "Add Task",
      attributes: {
        class: "task-button" },

      events: {
        click: { action: this.addTask, api: false } },

      container: this.nodes.form });

  }

  filterUI(filterTypes = this.filterTypes) {
    document.startViewTransition(() => {
      this.nodes.filters.innerHTML = "";

      filterTypes.forEach(type => {
        const button = this.elementCreator({
          type: "button",
          markup: type.name,
          attributes: {
            class: `task-filter${type.active ? " is-active" : ""}`,
            "data-param": type.queryParam !== undefined ? type.queryParam : null,
            "data-value": type.queryValue !== undefined ? type.queryValue : null },

          events: {
            click: { action: this.filterData, api: true } },

          container: this.nodes.filters });

      });
    });
  }

  listUI(data = this.data) {
    document.startViewTransition(() => {
      this.nodes.list.innerHTML = "";

      if (data.length === 0) {
        this.emptyListUI();
        return;
      }

      data.forEach(task => {
        const item = this.elementCreator({
          attributes: {
            class: `task-item${task.completed ? " is-completed" : ""}` },

          container: this.nodes.list });


        const checkbox = this.elementCreator({
          type: "input",
          attributes: {
            class: "task-status",
            type: "checkbox",
            checked: task.completed ? task.completed : null,
            "data-id": task.id },

          events: {
            change: { action: this.toggleStatus, api: true } },

          container: item });


        const name = this.elementCreator({
          type: "label",
          markup: task.name,
          attributes: {
            class: "task-name" },

          container: item });


        const button = this.elementCreator({
          type: "button",
          markup: "",
          attributes: {
            class: "task-delete",
            "data-id": task.id },

          events: {
            click: { action: this.deleteTask, api: true } },

          container: item });

      });
    });
  }

  init() {
    this.generalUI();
    this.formUI();
    this.listUI();
    this.filterUI();
  }}


document.addEventListener("DOMContentLoaded", function() {
    fetch('/api/todos')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("Data loaded:", data); 
            const TodoApp = new Todo({
                title: new Date().toDateString(),
                data: data.map(item => ({
                    id: item.id,
                    name: item.task,
                    completed: item.completed,
                    created_at: item.created_at,
                    updated_at: item.updated_at
                }))
            });
            TodoApp.init();
        })
        .catch(error => {
            console.error('Error loading todos:', error);
        });
});
