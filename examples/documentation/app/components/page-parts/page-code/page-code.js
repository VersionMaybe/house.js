this.filename = '';
this.code = '';
this.lang = '';

this.inline = false;
this.download = false;

this.onCopy = () => {
    console.log('Copy Code');
    const code = content.querySelector('#code-block');
    app.global.echo('media.copy', code).then((e) => {
        if (!e.error) {
            app.global.echo('toast.create', {
                message: 'Copied to clipboard.'
            });
        } else {
            app.global.echo('toast.create', {
                title: 'Clipboard Error',
                message: e.message,
                duration: 5000
            });
        };
    });
}

this.onDownload = () => {
    app.global.echo('toast.create', {
        message: "Downloading as file..."
    });

    app.global.echo('file.downloadText', {
        text: this.code,
        name: this.filename
    });
}