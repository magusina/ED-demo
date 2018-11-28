export function getJSON(url, fn) {
    const xhr = XMLHttpRequest
        ? new XMLHttpRequest()
        : new ActiveXObject("Microsoft.XMLHTTP");
    xhr.open("GET", url);
    xhr.onreadystatechange = () => {
        if (xhr.readyState > 3 && xhr.status === 200) {
            fn(JSON.parse(xhr.responseText));
        }
    };
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.send();
    return xhr;
}
