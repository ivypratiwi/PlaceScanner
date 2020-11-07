//loading status
$(document).ready(function () {
    $("#btnFetch").click(function () {
        const image = $("#uploadImage").val();
        //show a load button when there is a file uploaded
        if (image) {
            const $this = $(this);
            $this.prop("disabled", true);
            $('form#form').submit()
            const loadingText = `
            <span class="spinner-border spinner-load" role="status" aria-hidden="true"></span>  
            <span class="load-status">Loading</span>
            `;
            if ($this.html() !== loadingText) {
                $this.data('original-text', $this.html());
                $this.html(loadingText);
            }
        }
    })
})