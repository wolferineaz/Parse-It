function onRun(context) {

    class XMLColor {
        constructor(name, hex) {
            this.name = name;
            this.hex = hex;
        }

        toString() {
            return "\t<color name=\"" + this.name.replace(/-/g, "_") + "\">" + this.hex + "</color>\n";
        }
    }

    var doc = context.document;
    var pages = doc.pages();
    var symbolPage = null;

    for (var i = 0; i < pages.count(); i++) {
        var page = [pages objectAtIndex: i];

        if (page.nodeName() == "Symbols") {
            symbolPage = page;
            break;
        }
    }

    if (!symbolPage) {
        doc.showMessage("Not found Symbols page");
        return;
    }

    var symbols = symbolPage.symbols();

    var colors = [];
    for (var i = 0; i < symbols.count(); i++) {
        var symbol = [symbols objectAtIndex: i];
        if (symbol.nodeName().startsWith("@color/")) {
            var name = symbol.layers().firstObject().nodeName();
            var fill = symbol.layers().firstObject().style().fills().firstObject();
            var hex = fill ? hexColorForMSColor(fill.color()) : "rgba(0, 0, 0, 0)";

            colors.push(new XMLColor(name, hex));
        }
    }

    colors.sort(function(a, b){
        if(a.name > b.name) { return 1; }
        if(a.name < b.name) { return -1; }
        return 0;
    })

    var string = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<resources>\n";
    colors.forEach((color, index) => {
        string += color.toString();
    })
    string += "</resources>";

    string = NSString.stringWithString(string)
    string = string.stringByTrimmingCharactersInSet(NSCharacterSet.whitespaceAndNewlineCharacterSet())

    // saveToClipboard(string);
    saveToFile(string);

    function hexColorForMSColor(color) {
        const alpha = Number((color.alpha() * 100).toFixed(0));
        const red = Number((color.red() * 256).toFixed(0));
        const green = Number((color.green() * 256).toFixed(0));
        const blue = Number((color.blue() * 256).toFixed(0));
        return "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
    }

    function hexColorForRGB(alpha, red, green, blue) {
        const hexMax = 255;

        const alphaHex = pad(Math.floor(alpha * hexMax).toString(16), 2).toLowerCase().slice(0, 2);
        const redHex = pad(Math.floor(red * hexMax).toString(16), 2).toLowerCase().slice(0, 2);
        const greenHex = pad(Math.floor(green * hexMax).toString(16), 2).toLowerCase().slice(0, 2);
        const blueHex = pad(Math.floor(blue * hexMax).toString(16), 2).toLowerCase().slice(0, 2);

        return '#' + alphaHex + redHex + greenHex + blueHex;
    }

    function saveToFile(string) {
        var savePanel = NSSavePanel.savePanel();
        savePanel.allowedFileTypes = ["xml"];
        savePanel.nameFieldStringValue = doc.hudClientName() + "_color-palette-automatic.xml";

        var result = savePanel.runModal();
        if (result == NSFileHandlingPanelOKButton) {
            string.writeToFile_atomically_encoding_error(savePanel.URL().path(),
                                                         true, NSUTF8StringEncoding, null)
        }
    }

    function saveToClipboard(string) {
        var pasteBoard = NSPasteboard.generalPasteboard();
        pasteBoard.clearContents();
        pasteBoard.setString_forType(string, NSStringPboardType);
        doc.showMessage("Colors have been copied to clipboard");
    }

    function pad(num, size) {
        var s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }

}
