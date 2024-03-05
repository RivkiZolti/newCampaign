
function setSelectedStudents(table) {

    table.rows('.selected', { search: 'applied' }).data().each(function (data) {
        appModule.addSelectedStudent(data)
    });
}
function createcampaign(table){
    setSelectedStudents(table)
    if (appModule.getSelectedStudents().length >0){
        parseCampaignName()
        table.destroy()
        $('#studentTable').hide()
        $('#createcampaign').hide()
        $('#chooseSystem').show() 
    }else{
        alert("חובה לבחור לפחות תלמיד אחד מהרשימה")
    }
}

function getCurrentDate(){
    let today = new Date();
    let dd = String(today.getDate());
    let mm = String(today.getMonth() + 1);
    if (dd.length === 1) {
        dd = '0' + dd;
    }
    if (mm.length === 1) {
        mm = '0' + mm;
    }
    let yyyy = today.getFullYear();
    today = dd + '/' + mm + '/' + yyyy;
    return today
}


function parseCampaignName(){
    let groupsName={}
    $.each(appModule.getSelectedStudents(), function (_, user) {
        if (user["שם מוסד מלא"] in groupsName){
            
            if ($.inArray(user["שם קבוצה"], groupsName[user["שם מוסד מלא"]]) === -1){
                groupsName[user["שם מוסד מלא"]].push(user["שם קבוצה"])
            }

        }else{
            groupsName[user["שם מוסד מלא"]] = []
            groupsName[user["שם מוסד מלא"]].push(user["שם קבוצה"])
        }

    });
    let today = getCurrentDate()
    let nameData = today +":"
    let len
    let lastKey = Object.keys(groupsName)
    lastKey =lastKey[lastKey.length - 1]
    for (group in groupsName){
        len = groupsName[group].length
        nameData += group + ":" 
        for (index in groupsName[group]){
            nameData+= groupsName[group][index]

            if (index  < (len -1)){
                nameData += "|"
            }
        }
        if (group !== lastKey){
            nameData += ","
        }
        
    }
    nameData = nameData.slice(0, appModule.getMaxCharacters());
   $("#defaultText").text(nameData);
   $("#name").val($("#defaultText").text());

} 
function populateCallerIdSelect(response){
    let caller_ids = [response.mainDid];

    $.each(response.secondary_dids, function(_, did) {
        caller_ids.push(did.did);
    });

    $.each(response.callerIds, function(_, caller_id) {
        caller_ids.push(caller_id.callerId);
    });

    let selectElement = document.getElementById("caller_id");

    caller_ids.forEach(function(caller_id) {
        let option = document.createElement("option");
        option.value = caller_id;
        option.text = caller_id;
        selectElement.add(option);
    });
}

async function getCallerIds() {
    try {
        let payload = {
            'token': appModule.getToken(),
        };

        const response = await fetch(appModule.getBaseUrl() + "GetCustomerData", {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const responseData = await response.json();

        if (responseData.responseStatus !== 'OK') {
            console.error("get callerids failed. Server response: " + (response.message || "Unknown error"));
            Swal.fire({
                title: 'Error',
                text: 'שגיאה בקבלת אמצעי זיהוי',
                icon: 'error',
            });
            return false
        } 
        
        return responseData
    } catch (error) {
        console.error("get callerids failed reason : ", error);
        Swal.fire({
                title: 'Error',
                text: 'שגיאה בקבלת אמצעי זיהוי',
                icon: 'error',
            });
        return false
    }
}
async function buildCallerIdDropdown(){

    const response =await getCallerIds()
    if (response !== false){
        populateCallerIdSelect(response)
    }

}




function getPhonesInfo(){
    const fields = $("#myList").find('li').map(function() {
        return $(this).text();
    }).get();
    const selectedStudents = appModule.getSelectedStudents();
    let data="phone,name,moreinfo\n"
    let moreInfo = ""
    
    if (fields.length > 0) {
        for ( user in selectedStudents){
            moreInfo = ""
            fields.forEach(function(field) {
                moreInfo += field + ":" + selectedStudents[user][field] + " "

            });
            
            data += selectedStudents[user]["טלפון"] + "," + selectedStudents[user]["שם"] +  "," + moreInfo + "\n"
        }
    }
    return data
}

function DeleteTemplate(){
    let payload = {
        'token': appModule.getToken() ,
        'templateId' : appModule.getTemplateId()
    };

    $.ajax({
        url: appModule.getBaseUrl() + 'DeleteTemplate',
        type: 'POST',
        data: payload,
        cache: false,
        timeout: 60000,
        async: false,

        success: function(response) {
            if (response.responseStatus !== 'OK') {
                console.error("DeleteTemplate failed. Server response: " + (response.message || "Unknown error"));
                return false
            }
        },
        error: function( error) {
            console.error("DeleteTemplate failed reason : ", error);
            return false

        }
    });
}

async function createTemplate() {
    try {
        let payload = {
            'token': appModule.getToken(),
            "description": $("#name").val()
        };

        const response = await fetch(appModule.getBaseUrl() + "CreateTemplate", {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const responseData = await response.json();

        if (responseData.responseStatus !== 'OK') {
            console.error("Template creation failed. Server response: " + (responseData.message || "Unknown error"));
            Swal.fire({
                title: 'Error!',
                text: 'שגיאה ביצירת תבנית לקמפיין',
                icon: 'error',
            });
            return false;
        } else {
            appModule.setTemplateId(responseData.templateId)
            return await uploadFile();
        }
    } catch (error) {
        console.error("Template creation failed. Reason: " + error);
        Swal.fire({
            title: 'Error!',
            text: 'שגיאה ביצירת תבנית לקמפיין',
            icon: 'error',
        });
        return false;
    }
}

async function uploadFile() {
    try {
        let fileInput = $('#audioFile')[0];
        let file = fileInput.files[0];
        let formData = new FormData();
        formData.append('file', file);
        formData.append('token', appModule.getToken());
        formData.append('path', appModule.getTemplateId() + '.wav');
        formData.append('convertAudio', 1);

        const response = await fetch(appModule.getBaseUrl() + 'UploadFile', {
            method: 'POST',
            body: formData,
        });

        const responseData = await response.json();

        if (responseData.responseStatus !== 'OK') {
            console.error("File upload failed. Server response: " + (responseData.message || "Unknown error"));
            Swal.fire({
                title: 'Error!',
                text: 'שגיאה בהעלאת הקובץ',
                icon: 'error',
            });
            return false;
        } else {
            return await uploadPhoneList();
        }
    } catch (error) {
        console.error('File upload failed:', error);
        Swal.fire({
            title: 'Error!',
            text: 'שגיאה בהעלאת הקובץ',
            icon: 'error',
        });
        return false;
    }
}

async function uploadPhoneList() {
    try {
        let phones = getPhonesInfo()
        let payload = {
            "token": appModule.getToken(),
            "templateId": appModule.getTemplateId(),
            "data": phones
        };

        const response = await fetch(appModule.getBaseUrl() + 'UploadPhoneList', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const responseData = await response.json();

        if (responseData.responseStatus !== "OK") {
            console.error("Uploading phone list failed. Server response: " + (responseData.message || "Unknown error"));
            Swal.fire({
                title: 'Error',
                text: 'שגיאה בהעלאת מספרי פלאפון',
                icon: 'error',
            });
            return false;
        } else {
            return await runCampaign();
        }
    } catch (error) {
        console.error("Uploading phone list failed. Reason: " + error);
        Swal.fire({
            title: 'Error',
            text: 'שגיאה בהעלאת מספרי פלאפון',
            icon: 'error',
        });
        return false;
    }
}

async function runCampaign() {
    try {
        let payload = {
            'token': appModule.getToken(),
            'templateId': appModule.getTemplateId(),
            'callerId': $("#caller_id option:selected").val()
        };

        const response = await fetch(appModule.getBaseUrl() + 'RunCampaign', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const responseData = await response.json();

        if (responseData.responseStatus !== "OK") {
            console.error("RunCampaign failed. Server response: " + (responseData.message || "Unknown error"));
            Swal.fire({
                title: 'Error!',
                text: 'שגיאה בהרצת הקמפיין',
                icon: 'error',
            });
            return false;
        } else {
            return true;
        }
    } catch (error) {
        console.error("RunCampaign failed. Reason: " + error);
        Swal.fire({
            title: 'Error!',
            text: 'שגיאה בהרצת הקמפיין',
            icon: 'error',
        });
        return false;
    }
}
function showLoadingIndicator() {
    $('#loading-overlay').css('display', 'flex');
}

function hideLoadingIndicator() {
    helperModule.hideElements(['loading-overlay'])
}

