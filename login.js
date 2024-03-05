async function login(username, password) {
    try{
        let payload = {
            'username': username,
            'password': password
        };
        const response = await fetch(appModule.getBaseUrl() + "Login", {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const responseData = await response.json();

        if (responseData.responseStatus !== 'OK') {
            Swal.fire({
                title: 'Error!',
                text: 'שם המשתמש או הסיסמא שגויים',
                icon: 'error',
            });
            $('#reset').show()
            return false
        } else{
            appModule.setToken(username+ ":" + password)
            return true
            
        }
    } catch (error) {
        console.error("login failed reason : ", error);
        Swal.fire({
            title: 'Error!',
            text: 'שם המשתמש או הסיסמא שגויים',
            icon: 'error',
        });
        return false;
    }
}

function togglePassword() {
    let passwordInput = $("#password");
    let toggleIcon = $("#toggle-password i");

    if (passwordInput.attr("type") === "password") {
        passwordInput.attr("type", "text");
        toggleIcon.removeClass("fa-eye").addClass("fa-eye-slash");
    } else {
        passwordInput.attr("type", "password");
        toggleIcon.removeClass("fa-eye-slash").addClass("fa-eye");
    }
}
