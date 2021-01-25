app.global.listen('file.get', (options) => this.selectFiles(options));
app.global.listen('file.read', (options) => this.readFile(options));
app.global.listen('file.download', (options) => this.download(options));
app.global.listen('file.downloadText', (options) => this.downloadText(options));

this.selectFiles = ({ multiple = false, types, maxsize }) => {
    return new Promise((res) => {
        const input = document.createElement('input');
        input.type = 'file';
        if (multiple) { input.setAttribute('multiple', 'true'); }
        if (types) { input.setAttribute('accepts', types.join(',')); }

        input.onchange = () => {
            const files = input.files;
            const filesAllowed = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const size = file.size;

                if (!maxsize || size <= maxsize) {
                    filesAllowed.push(file);
                } else {
                    input.remove();
                    res({ error: 'Filesize', message: 'File too big "' + size + '" bytes.' });
                }
            }

            res(filesAllowed);
            input.remove();
        };
        input.click();
    });
}

this.readFile = ({ file = new File, method }) => {
    return new Promise((res) => {
        const reader = new FileReader();
        reader.onload = (data) => {
            res(data.target.result);
        }
        switch (method) {
            default:
            case 'text':
                reader.readAsText(file);
                break;
            case 'dataurl':
                reader.readAsDataURL(file);
                break;
            case 'binary':
                reader.readAsBinaryString(file);
                break;
            case 'arraybuffer':
                reader.readAsArrayBuffer(file);
                break;
        }
    });
}

this.download = ({ object, name }) => {
    return new Promise((res) => {
        const url = window.URL.createObjectURL(object);
        const button = document.createElement('a');
        button.href = url;
        button.download = name;
        button.click();
        res();
    });
}

this.downloadText = ({ text, name, type }) => {
    const blob = new Blob([text], { type });
    return this.download({ object: blob, name });
}
