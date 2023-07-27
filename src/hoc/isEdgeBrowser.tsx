
// @link https://stackoverflow.com/questions/31721250/how-to-target-edge-browser-with-javascript
// Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) \
// Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.26

const isEdgeBrowser = window.navigator.userAgent.indexOf("Edg") > -1
export default isEdgeBrowser