const submit = document.querySelector('.submit')
const blogtitle = document.querySelector('#blogtitle')
const blogbody = document.querySelector('#blogbody')
console.log(blogtitle, blogbody);


submit.addEventListener('click', (e) => {
    e.preventDefault()

    const blogData = {
        title: blogtitle.value,
        blogBody: blogbody.value

    }
    console.log(blogData)

    const newData = {
        method: 'POST',

        headers: {
            'Content-Type': "application/json"

            // "authorization": `Bearer ${token}`
        },
        body: JSON.stringify(blogData)
    }

    console.log(newData)
    fetch("http://localhost:6500/api/blogs", newData)
        .then(async(n) => {
            const res = await n.json()
            console.log(res)
            if (res.status == 'success') {
                alert('Blog created');
                location.reload();
            } else {
                alert('Blog not created!')
            }

        })
})