const helperModule = (() =>{
    
    return {
        hideElements : (elements) => {
            for (let value of elements) {
                $("#" + value).css("display", "none");
            }
        },

        showElements : (elements) => {
            for (let value of elements) {
                $("#" + value).css("display", "block");
            }
        }

    }
})();
