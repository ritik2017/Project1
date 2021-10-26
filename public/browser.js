const config = {
    headers: {
        'content-type': 'application/json'
    }
}

document.addEventListener('click', function(event) {
    if(event.target.classList.contains('edit-me')) {
        let userInput = prompt("Enter your new todo name");

        if(userInput) {
            let body = JSON.stringify({
                _id: event.target.getAttribute("data-id"),
                message: userInput
            });

            console.log(body);

            axios.patch('/edit-item', body, config)
            .then(function(response) {
                if(response.status == 200) {
                    event.target.parentElement.parentElement.querySelector('.item-text').innerHTML = userInput;
                }
                else {
                    alert("An error occured");
                }
            })
            .catch(function(err) {
                alert("An error occured");
            })
        }
    }

    if(event.target.classList.contains('delete-me')) {

        if(confirm("Do you want to delete the item")) {
            let body = JSON.stringify({
                _id: event.target.getAttribute("data-id"),
            });

            axios.post('/delete-item', body, config)
            .then(function(response) {
                if(response.status == 200) {
                    event.target.parentElement.parentElement.remove();
                }
                else {
                    alert("An error occured");
                }
            })
            .catch(function(err) {
                alert("An error occured");
            })
        }
    }

    if(event.target.getAttribute('id') == 'show_more') {
        axios.post(`/pagination_dashboard?skip=${skip}`, JSON.stringify({}), config)
        .then(res => {
            if(res.data.status != 200) {
                alert('An error occured');
                return;
            }
            console.log(res.data.value[0].data);
    
            document.getElementById("item_list").insertAdjacentHTML('beforeend', res.data.value[0].data.map(function(todo) {
                return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
                <span class="item-text">${todo.todo}</span>
                <div>
                  <button data-id="${todo._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
                  <button data-id="${todo._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
                </div>
              </li>`
            }).join(''));
            skip += res.data.value[0].data.length;
        })
        .catch(err => {
            alert(err);
        }) 
    }

    if(event.target.classList.contains('add_item')) {
        event.preventDefault();

        let todoItem = document.getElementById('create_field');

        console.log(todoItem.value);

        axios.post('/create-item', JSON.stringify({
            itemName: todoItem.value
        }), config)
        .then(res => {
            console.log(res);
            todoItem.value = "";
        })
        .catch(err => {
            alert("Todo Creation Failed");
        })
    }
});

ourHtml = todos.map(function(todo) {
    return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
    <span class="item-text">${todo.todo}</span>
    <div>
      <button data-id="${todo._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
      <button data-id="${todo._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
    </div>
  </li>`
}).join('')

document.getElementById("item_list").insertAdjacentHTML('beforeend', ourHtml);

let skip = 0;

window.onload = function() {
    axios.post(`/pagination_dashboard?${skip}`, JSON.stringify({}), config)
    .then(res => {
        if(res.data.status != 200) {
            alert('An error occured');
            return;
        }
        console.log(res.data.value[0].data);

        document.getElementById("item_list").insertAdjacentHTML('beforeend', res.data.value[0].data.map(function(todo) {
            return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
            <span class="item-text">${todo.todo}</span>
            <div>
              <button data-id="${todo._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
              <button data-id="${todo._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
            </div>
          </li>`
        }).join(''));
        skip += res.data.value[0].data.length;
    })
    .catch(err => {
        alert(err);
    }) 
}