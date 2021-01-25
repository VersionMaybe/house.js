app.global.listen('media.copy', (element) => this.copy(element));

this.copy = (element) => {
    return new Promise((res) => {
        var node = element;

        if (document.body.createTextRange) {
            const range = document.body.createTextRange();
            range.moveToElementText(node);
            range.select();
            document.execCommand("copy");
            res({});
        } else if (window.getSelection) {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(node);
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand("copy");
            res({});
        } else {
            res({ error: 'Unsupported', message: 'Could not select text in node: Unsupported browser.' });
        }
    });
}