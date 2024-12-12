const precachedModels = {};


async function loadJSON(file) {
    const response = await fetch(file);
    return response.json();
}

async function preloadModels(modelNames) {
    for (const modelName of modelNames) {
        const vectorsData = await loadJSON(`../../backend/modelos_ouput/${modelName}_vectores.json`);
        const labelsData = await loadJSON(`../../backend/modelos_ouput/${modelName}.json`);
        
        precachedModels[modelName] = { vectorsData, labelsData };
    }
    console.log("Todos los modelos se han precargado.");
}


async function main(model_name,selectedIndices) {
    if (!precachedModels[model_name]) {
        throw new Error(`El modelo ${model_name} no está precargado.`);
    }

    const { vectorsData, labelsData } = precachedModels[model_name];
    // const vectorsData = await loadJSON(`../../backend/modelos_ouput/${model_name}_vectores.json`);
    // const labelsData = await loadJSON(`../../backend/modelos_ouput/${model_name}.json`);
    
    const vectors = [];
    const labels = [];
    const realLabels = [];
    const predictedLabels = [];
    const probabilities = [];
    const images = [];

    selectedIndices.forEach(index => {
        const dataIndex = index;
        vectors.push(vectorsData["Vectores de caracteristicas"][dataIndex]);
        labels.push(labelsData["Nombres de los archivos"][dataIndex]);
        realLabels.push(labelsData["Etiquetas reales"][dataIndex]);
        predictedLabels.push(labelsData["Etiquetas predichas"][dataIndex]);
        probabilities.push(labelsData["Probabilidades"][dataIndex]);
        images.push(labelsData["Nombres de los archivos"][dataIndex]);
    });

    const distanceMatrix = calculateDistanceMatrix(vectors);
    const tree = neighborJoining(distanceMatrix, labels);
    renderTreeRadial(tree, { labels, realLabels, predictedLabels, probabilities, images });
}

function calculateDistanceMatrix(vectors) {
    const n = vectors.length;
    const distanceMatrix = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const distance = euclideanDistance(vectors[i], vectors[j]);
            distanceMatrix[i][j] = distance;
            distanceMatrix[j][i] = distance;
        }
    }
    return distanceMatrix;
}

function euclideanDistance(vec1, vec2) {
    return Math.sqrt(vec1.reduce((sum, v, idx) => sum + Math.pow(v - vec2[idx], 2), 0));
}

function neighborJoining(distanceMatrix, labels) {
    let nodes = labels.map((label, i) => ({ id: i, label, children: [] }));
    const n = distanceMatrix.length;

    while (nodes.length > 2) {
        const { i, j } = findClosestPair(distanceMatrix);
        const newNode = {
            id: nodes.length,
            children: [nodes[i], nodes[j]],
            label: null
        };

        const newDistances = [];
        for (let k = 0; k < distanceMatrix.length; k++) {
            if (k !== i && k !== j) {
                const distance = (distanceMatrix[i][k] + distanceMatrix[j][k] - distanceMatrix[i][j]) / 2;
                newDistances.push(distance);
            }
        }

        distanceMatrix = updateDistanceMatrix(distanceMatrix, i, j, newDistances);

        nodes = nodes.filter((_, idx) => idx !== i && idx !== j);
        nodes.push(newNode);
    }

    return { id: "root", children: nodes };
}

function findClosestPair(matrix) {
    let minDistance = Infinity, pair = { i: 0, j: 0 };
    const n = matrix.length;

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (matrix[i][j] < minDistance) {
                minDistance = matrix[i][j];
                pair = { i, j };
            }
        }
    }
    return pair;
}

function updateDistanceMatrix(matrix, i, j, newDistances) {
    const n = matrix.length;
    const newMatrix = [];

    let kIdx = 0;
    for (let k = 0; k < n; k++) {
        if (k !== i && k !== j) {
            const row = [];
            let lIdx = 0;

            for (let l = 0; l < n; l++) {
                if (l !== i && l !== j) {
                    row.push(matrix[k][l]);
                }
            }
            row.push(newDistances[kIdx]);
            newMatrix.push(row);
            kIdx++;
        }
    }

    newMatrix.push([...newDistances, 0]);
    return newMatrix;
}

function renderTreeRadial(tree, data) {
    const svgContainer = d3.select(".right-top");
    const width = svgContainer.node().clientWidth;
    const height = svgContainer.node().clientHeight;

    // El margen se puede reducir para maximizar el espacio disponible
    const margin = 25;

    // Calcular el tamaño del gráfico basado en el tamaño total del contenedor menos el margen
    const radius = Math.min(width, height) / 2 - margin;

    const tooltip = d3.select(".right-top").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Reutilizamos el SVG en lugar de crear uno nuevo cada vez
    let svg = svgContainer.select("svg");

    // Si no existe, creamos uno nuevo
    if (svg.empty()) {
        svg = svgContainer.append("svg")
            .attr("width", width)
            .attr("height", height);
    } else {
        // Si existe, limpiamos el contenido para redibujar
        svg.selectAll("*").remove();
    }

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const treeLayout = d3.cluster()
        .size([2 * Math.PI, radius]);

    const root = d3.hierarchy(tree);
    treeLayout(root);

    const colors = ['navy', 'turquoise', 'darkorange', 'green'];

    const link = g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y))
        .attr("stroke", "#aaa")
        .attr("stroke-width", 1.5);

        const node = g.selectAll(".node")
        .data(root.descendants().filter(d => d.depth === 0 || d.data.label !== null)) // Filtra solo raíz y hojas
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `
            rotate(${d.x * 180 / Math.PI - 90}) 
            translate(${d.y},0)
        `);
    
// Set para rastrear nodos seleccionados
const selectedNodes = new Set();

node.append("circle")
    .attr("r", 4)
    .attr("fill", d => d.depth === 0 ? "black" : colors[data.realLabels[d.data.id]])
    .attr("opacity", d => d.depth === 0 ? 1 : data.probabilities[d.data.id])
    .on("mouseover", function (event, d) {
        if (d.depth !== 0) {
            const id = d.data.id;
    
            tooltip.transition()
                .duration(100)
                .style("opacity", 0.9);
    
            tooltip.html(`
                <img src="images/${data.images[id]}" alt="Imagen del grano de café">
                <table>
                    <tr>
                        <td>Real:</td>
                        <td>${data.realLabels[id]}</td>
                    </tr>
                    <tr>
                        <td>Pred:</td>
                        <td>${data.predictedLabels[id]}</td>
                    </tr>
                    <tr>
                        <td>Prob:</td>
                        <td>${(data.probabilities[id] * 100).toFixed(1)}%</td>
                    </tr>
                </table>
            `)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        }
    })    
    .on("mouseout", function (event, d) {
        if (d.depth !== 0) {
            tooltip.transition()
                .duration(100)
                .style("opacity", 0);
        }
    })
    .on("click", function (event, d) {
        if (d.depth !== 0) {
            const id = d.data.id;

            // Manejar selección y deselección del nodo
            if (selectedNodes.has(id)) {
                selectedNodes.delete(id);
                d3.select(this).transition().duration(200).attr("r", 4);
                d3.select(`#detail-${id}`).remove();
            } else {
                selectedNodes.add(id);
                d3.select(this).transition().duration(200).attr("r", 8);

                // Crear o encontrar el contenedor de detalle
                let detailsContainer = d3.select("#details-container");
                if (detailsContainer.empty()) {
                    detailsContainer = d3.select(".right-top").append("div")
                        .attr("id", "details-container")
                        .style("display", "flex")
                        .style("flex-wrap", "wrap")
                        .style("gap", "10px")
                        .style("padding", "10px")
                        .style("background-color", "#f0f0f0");
                }

                // Agregar tarjeta de detalle
                const detailDiv = detailsContainer.append("div")
                    .attr("id", `detail-${id}`)
                    .style("border", "1px solid #ccc")
                    .style("border-radius", "5px")
                    .style("padding", "5px")
                    .style("background", "white")
                    .style("width", "120px")
                    .style("text-align", "center");

                detailDiv.html(`
                    <img src="images/${data.images[id]}" alt="Imagen del grano de café" style="width: 100%; height: auto; border-radius: 3px;">
                    <p style="margin: 5px 0; font-size: 10px;">Real: ${data.realLabels[id]}</p>
                    <p style="margin: 5px 0; font-size: 10px;">Pred: ${data.predictedLabels[id]}</p>
                    <p style="margin: 5px 0; font-size: 10px;">Prob: ${(data.probabilities[id] * 100).toFixed(1)}%</p>
                    <button style="margin-top: 5px; font-size: 10px; padding: 2px 5px; border: none; border-radius: 3px; background-color: cadetblue; color: white; cursor: pointer;">Eliminar</button>
                `);

                // Evento para eliminar tarjeta
                detailDiv.select("button").on("click", () => {
                    selectedNodes.delete(id);
                    d3.select(this).transition().duration(200).attr("r", 4);
                    detailDiv.remove();
                });
            }
        }
    });

    // Redimensionar el gráfico cuando la ventana cambie de tamaño
    window.addEventListener("resize", () => {
        const width = svgContainer.node().clientWidth;
        const height = svgContainer.node().clientHeight;
        svg.attr("width", width).attr("height", height);

        // Actualiza el radio y vuelve a redibujar el gráfico
        const radius = Math.min(width, height) / 2 - margin;
        treeLayout.size([2 * Math.PI, radius]);
        treeLayout(root);

        // Limpiar el gráfico y volver a dibujarlo
        svg.selectAll("*").remove();
        renderTreeRadial(tree, data);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const modelNames = ["VGG19", "DenseNet201", "Xception", "ResNet50V2"];
    console.log("Cargando modelos")
    await preloadModels(modelNames);
    console.log("Aplicación lista para usar.");
});