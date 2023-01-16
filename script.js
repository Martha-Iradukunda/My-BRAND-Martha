// const toggleButton = document.getElementsByClassName('toggle-button')[0]
// const navbarLinks = document.getElementsByClassName('navbar-links')[0]

// toggleButton.addEventListener('click', () => {
//     navbarLinks.classList.toggle('active')
// })




//LOGIN

function myfunction() {
    var x = document.getElementById("pass");

    if (x.type === "password") {
        x.type = "text";
    } else {
        x.type = "password";
    }
}

function validate() {
    var password = document.getElementById("pass");
    var userrname = document.getElementById("username");

    var length = document.getElementById("length");

    if (password.value.length >= 8 && userrname.value.length >= 5) {
        alert("Login Succesfull");
        window.location.replace("index.html");
        return false;
    } else {
        alert("Login Failed");
    }
}
// Sign Up page
function myfunctionUP() {
    var y = document.getElementById("pass1");

    if (y.type === "password") {
        y.type = "text";
    } else {
        y.type = "password";
    }
}

function validateUp() {
    var password = document.getElementById("pass1");
    var nameVal = document.getElementById("username1");
    var emailVal = document.getElementById("email1");
    var pwdTwoVal = document.getElementById("pwdTwoSignUp");


    var length = document.getElementById("length");

    if (password.value.length >= 8 && nameVal.value.length >= 5) {
        alert("Acccount created successfully");
        window.location.replace("login.html");
        return false;
    } else {
        alert("Account not created!");
    }
}

//LOCALSTORAGE

function signupFuncion() {
    nameValue = document.getElementById("username1").value;
    emailValue = document.getElementById("email1").value;
    pwdValue = document.getElementById("pass1").value;
    pwdTwoValue = document.getElementById("pwdTwoSignUp").value;



    if (pwdTwoValue.length != 0 && pwdValue.length != 0 && pwdValue == pwdTwoValue) {
        if (nameValue.length != 0 && emailValue.length != 0 && pwdValue.length >= 8) {
            const user = {
                name: nameValue,
                email: emailValue,
                password: pwdValue
            }
            window.localStorage.setItem("userSignUp", JSON.stringify(user));

            let newObject = window.localStorage.getItem("user");
            console.log(JSON.parse(newObject));
            alert("name:" + JSON.parse(newObject).name + ", email:" + JSON.parse(newObject).email + ", password:" + JSON.parse(newObject).password);
        } else {
            alert("Invalid email or password!");
        }
    } else {
        alert("Passwords do not match!");
    }


}

//BLOGS

function createBlog() {
    titleValue = document.getElementById("titleBlog").value;
    bodyValue = document.getElementById("bodyBlog").value;

    if (titleValue.length != 0 && bodyValue.length != 0) {
        var blog = { "title": titleValue, "body": bodyValue, "likes": 0 };

        var result = JSON.parse(localStorage.getItem("blog32") || "[]");
        console.log("result100" + result);
        console.log("result100" + typeof result);
        result.push(blog);


        localStorage.setItem("blog32", JSON.stringify(result));
        titleBlog.value = "";
        bodyBlog.value = "";
        getBlogs();
    } else {
        alert("Invalid title or blog body!");
    }
}

function getBlogs() {
    document.getElementById("blogsDisplay").innerHTML = "";

    var blogs = JSON.parse(localStorage.getItem("blog32") || "[]");

    let blogsDisplay = document.getElementById("blogsDisplay");


    if (blogs != null) {

        blogs.forEach(function(blog, index) {
            let li = document.createElement("li");
            li.innerText = "\n\n\nTitle: " + blog.title + "\nBody: " + blog.body + "\nLikes: " + blog.likes + "\n\n";

            var editbutton = document.createElement("button");
            editbutton.innerHTML = 'Edit ';
            editbutton.onclick = function() {
                editBlog(blog.title, blog.body);
            };

            var deletebutton = document.createElement("button");
            deletebutton.innerHTML = 'Delete  ';
            deletebutton.onclick = function() {
                deleteBlog(blog.title);
            };

            var likebutton = document.createElement("button");
            likebutton.innerHTML = 'Like';

            likebutton.onclick = function() {
                likeABlog(blog.title);
            };

            blogsDisplay.appendChild(li);
            blogsDisplay.appendChild(deletebutton);
            // console.log("\t\t");
            blogsDisplay.appendChild(editbutton);
            console.log("\t\t");

            blogsDisplay.appendChild(likebutton);


        });


    }
}

function likeABlog(title) {
    var blogs = JSON.parse(localStorage.getItem("blog32") || "[]");

    blogs.forEach(function(blog, index) {

        if (blog.title == title) {
            likes = parseInt(blog.likes) + 1;
            blog.likes = likes;
            localStorage.setItem("blog32", JSON.stringify(blogs));
        }
    });

    getBlogs();
}

function editBlog(title, body) {
    var modal = document.getElementById("myModal");
    modal.style.display = "block";

    document.getElementById('ediTitleContact').value = title;
    document.getElementById('editBodyBlog').value = body;

    var span = document.getElementsByClassName("close")[0];
    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    updateBUtton = document.getElementById('updateButton');

    updateBUtton.onclick = function() {
        console.log("updateBUtton" + updateBUtton);
        ediTitleContact = document.getElementById('ediTitleContact').value;
        editBodyBlog = document.getElementById('editBodyBlog').value;


        var blogs = JSON.parse(localStorage.getItem("blog32") || "[]");

        blogs.forEach(function(blog, index) {

            if (blog.title == title) {
                blog.title = ediTitleContact;
                blog.body = editBodyBlog;
                localStorage.setItem("blog32", JSON.stringify(blogs));
            }
        });

        getBlogs();

        var modal = document.getElementById("myModal");
        modal.style.display = "none";
    };
}


function deleteBlog(title) {
    var blogs = JSON.parse(localStorage.getItem("blog32") || "[]");

    blogs.forEach(function(blog, index) {
        console.log("index" + index);

        if (blog.title == title) {
            console.log("index 2" + index);
            blogs.splice(index, 1);
            localStorage.setItem("blog32", JSON.stringify(blogs));
            getBlogs();

        }
    });
}

//CONTACT FORM

function createContact() {
    emailContact = document.getElementById("emailContact").value;
    firstNameContact = document.getElementById("firstNameContact").value;
    lastNameContact = document.getElementById("lastNameContact").value;
    otherNameContact = document.getElementById("otherNameContact").value;
    messageContact = document.getElementById("messageContact").value;

    if (emailContact.length != 0 && firstNameContact.length != 0 && lastNameContact.length != 0 && messageContact.length != 0) {
        var question = { "email": emailContact, "firstname": firstNameContact, "lastname": lastNameContact, "othername": otherNameContact, "message": messageContact };

        var questions = JSON.parse(localStorage.getItem("questions") || "[]");
        questions.push(question);


        localStorage.setItem("questions", JSON.stringify(questions));
        emailContact.value = "";
        firstNameContact.value = "";
        lastNameContact.value = "";
        otherNameContact.value = "";
        messageContact.value = "";
    } else {
        alert("Invalid firstname, lastname, email or question");
    }
}

// var questions = JSON.parse(localStorage.getItem("questions") || "[]");



const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener("click", () => {
    container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
    container.classList.remove("sign-up-mode");
});

//Local storage
function setItem() {
    var name = "Marita";
    localStorage.setItem("name", JSON.stringify(name));
}

function getItem() {
    var nameTwo = window.localStorage.getItem("name");
    console.log(JSON.parse(nameTwo));
}

//LOCALSTORAGE 2 On LOGIN/SIGNup
//ACCOUNTS
// const Acccount = {
//     username,
//     email,
//     password,
//     passpword2,
// };
// let accounts = JSON.parse(localStorage.getItem("accounts")) || [];
// if (accounts.some((account) => account.email === email)) {
//     window.location.href = "login.html";
//     alert("The account already exists.");
//     return;
// }
// accounts.push(account);
// localStorage.setItem("accounts", JSON.stringify(accounts));
// window.location.href = "home.html";
// alert("Account created successfully");