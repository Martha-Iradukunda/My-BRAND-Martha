const container = document.querySelector('.container')
console.log(container);

const newData = {
    method: 'GET',
    headers: {
        'Content-Type': "application/json"
            // "authorization": `Bearer ${token}`
    }
}
console.log(newData)
fetch("http://localhost:6500/api/blogs", newData)
    .then(async(n) => {
        const res = await n.json()
        console.log(res)
        let allblogs = res.data
            // const grid = document.querySelector(".grid")
        allblogs.forEach((data) => {

            id = JSON.stringify(data._id);
            container.innerHTML += `
            <div class="card">
            <h3>${data.title}</h3>
            <p>${data.blogBody}</p>

        </div>`
        })

    })