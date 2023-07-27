

// @link https://gist.github.com/jgornick/3786127
export function parseMultipleJson(ss : string|any) {

    if ('string' !== typeof ss) {
        return [ss]
    }

    ss = ss.split("\n").map(l => l.trim()).join("");

    let start = ss.indexOf("{");

    let open = 0;

    const res : any[] = [];

    for (let i = start; i < ss.length; i++) {

        if ((ss[i] === "{") && (i < 2 || ss.slice(i - 2, i) !== "\\\"")) {

            open++

            if (open === 1) {

                start = i

            }

        } else if ((ss[i] === "}") && (i < 2 || ss.slice(i - 2, i) !== "\\\"")) {

            open--;

            if (open === 0) {

                res.push(JSON.parse(ss.substring(start, i + 1)));

                start = i + 1

            }

        }

    }

    return res

}

