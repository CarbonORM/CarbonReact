
export default function ScrollIntoViewDirective(el: Element) {

    el?.scrollIntoView({behavior: 'auto', block:'nearest'});

}