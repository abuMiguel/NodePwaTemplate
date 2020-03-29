async function Logout() {
    const url = "/logout";
    const response = await fetch(url);
}

async function SendEmail(recipients, message, subject) {
    console.log("subject:" + subject);
    const url = "/api/email";
    const response = await fetch(url,
        {
            method: 'POST',
            body: JSON.stringify({ recipients, message, subject }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    const res = await response.text();
    if (!res || res != "success")
        console.log(res);
}

async function GenerateDropdown(endpoint, elementId) {
    const url = endpoint;
    const response = await fetch(url);
    const data = await response.json();

    var dropDown = document.getElementById(elementId);
    let blank = document.createElement("option");
    blank.text = "";
    dropDown.add(blank);

    data.forEach(d => {
        var option = document.createElement("option");
        option.text = d.text;
        option.value = d.value;
        dropDown.add(option);
    });
}

async function UploadFile(elementId) {
    const url = "/api/upload";
    let file = document.getElementById(elementId);
    if (file.files.length < 1) {
        alert("Please select a file to upload.");
        return;
    }
    var data = new FormData();
    data.append("upload", file.files[0]);
    const response = await fetch(url,
        {
            method: 'POST',
            body: data
        });
    const res = await response.text();
    if (res == "success") {
        alert("Upload Success");
    }
    else {
        alert("Upload Failed");
    }
}