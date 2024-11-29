document.addEventListener("DOMContentLoaded", function() {
    window.SIZE_POINT = 4;
    window.SIZE_POINT_SELECTED = 8;
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffee00'];

    let globalSelectedIndices = new Set();
    let isBrushActive = false;

    let etiquetasVisualizacion = "trueLabel"

    const windows = [
        { id: "window1", selectedIndices: new Set(), data: [], selectedModel: "VGG19", selectedProjection: "UMAP" },
        { id: "window2", selectedIndices: new Set(), data: [], selectedModel: "Xception", selectedProjection: "TSNE" },
        { id: "window3", selectedIndices: new Set(), data: [], selectedModel: "DenseNet201", selectedProjection: "TRIMAP" },
        { id: "window4", selectedIndices: new Set(), data: [], selectedModel: "ResNet50V2", selectedProjection: "PACMAP" }
    ];

    const tooltip = d3.select(".tooltip");

    
    function getWindowById(id) {
        return windows.find(w => w.id === id);
    }

    function generate_points(data_response, projection, win) {
        win.data = [];
        let clases = data_response["Nombres de las clases"];

        const minX = d3.min(data_response[projection], d => d[0]);
        const minY = d3.min(data_response[projection], d => d[1]);

        const maxX = d3.max(data_response[projection], d => d[0]);
        const maxY = d3.max(data_response[projection], d => d[1]);

        const x = d3.scaleLinear()
                .domain([minX, maxX])
                .range([0, 100]);

        const y = d3.scaleLinear()
                    .domain([minY, maxY])
                    .range([0, 100]);

        for (let i = 0; i < data_response["Etiquetas reales"].length; i++) {

            // color = data_response[etiquetasVisualizacion][i]
            let color = data_response["Etiquetas predichas"][i] === data_response["Etiquetas reales"][i]
                        ? data_response["Etiquetas predichas"][i]
                        : data_response["Etiquetas reales"][i];

            const xPos = x(data_response[projection][i][0]);
            const yPos = y(data_response[projection][i][1]);

            win.data.push({ 
                x: xPos, 
                y: yPos, 
                className: color, 
                src: "images/" + data_response["Nombres de los archivos"][i],
                trueLabel: data_response["Etiquetas reales"][i],
                predictLabel: data_response["Etiquetas predichas"][i],
                fileName: data_response["Nombres de los archivos"][i],
                probability: (data_response["Probabilidades"][i] * 100).toFixed(2)
            });

            // console.log(data_response["Probabilidades"])
        }
    }

    function getColor(className) {
        const index = parseInt(className) || 0;
        return colors[index % colors.length];
    }
    
    function zoomWindow(win) {
        const selectedData = win.data.filter(d => globalSelectedIndices.has(d.fileName));
    
        if (selectedData.length === 0) {
            alert('No hay puntos seleccionados.');
            return;
        }
    
        const minX = d3.min(selectedData, d => d.x);
        const maxX = d3.max(selectedData, d => d.x);
        const minY = d3.min(selectedData, d => d.y);
        const maxY = d3.max(selectedData, d => d.y);
    
        const xScale = d3.scaleLinear()
            .domain([minX, maxX])
            .range([20, 80]); 
    
        const yScale = d3.scaleLinear()
            .domain([minY, maxY])
            .range([20, 80]);  
    
        const imageSize = Math.max(70, Math.min(100, 400 / selectedData.length));
        const borderSize = Math.max(1, imageSize / 30); 
    
        const container = document.querySelector('.right-top');
    
        container.innerHTML = '';
    
        container.style.position = 'relative';
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.height = '50%';
        container.style.width = '100%';
    
        selectedData.forEach(d => {
            // console.log("Imprimendo d",probability)

            const scaledX = xScale(d.x);  
            const scaledY = yScale(d.y);  
    
            const imgContainer = document.createElement('div');
            imgContainer.style.position = 'absolute';
            imgContainer.style.left = `${scaledX}%`;
            imgContainer.style.top = `${scaledY}%`;
            imgContainer.style.border = `${borderSize}px solid ${getColor(d[etiquetasVisualizacion])}`;
    
            const img = document.createElement('img');
            img.src = d.src;
            img.alt = "Imagen";
            img.style.width = `${imageSize}px`;
            img.style.height = `${imageSize}px`;
            img.style.opacity = '0.8';
            img.style.transition = 'opacity 0.3s ease, transform 0.3s ease, z-index 0.3s ease';
            img.style.borderRadius = '3px';
            img.style.position = 'relative';
    
            img.addEventListener('mouseover', () => {
                img.style.opacity = '1';
                img.style.transform = 'scale(1.2)';
                img.style.zIndex = '100';
            });
    
            img.addEventListener('mouseout', () => {
                img.style.opacity = '0.8';
                img.style.transform = 'scale(1)';
                img.style.zIndex = '1';
            });
    
            imgContainer.appendChild(img);
            container.appendChild(imgContainer);
        });
    }
    
    // function zoomWindow(win) {
    //     const selectedData = win.data.filter(d => globalSelectedIndices.has(d.fileName));
    
    //     if (selectedData.length === 0) {
    //         alert('No hay puntos seleccionados.');
    //         return;
    //     }
    
    //     // Definir las escalas basadas solo en los puntos seleccionados
    //     const minX = d3.min(selectedData, d => d.x);
    //     const maxX = d3.max(selectedData, d => d.x);
    //     const minY = d3.min(selectedData, d => d.y);
    //     const maxY = d3.max(selectedData, d => d.y);
    
    //     // Escalas para reescalar las coordenadas a todo el tamaño de la ventana
    //     const xScale = d3.scaleLinear()
    //         .domain([minX, maxX])
    //         .range([0, 100]); 
    
    //     const yScale = d3.scaleLinear()
    //         .domain([minY, maxY])
    //         .range([0, 100]);  // El rango de 0% a 100% para aprovechar el espacio vertical
    

    //     const imageSize = Math.max(70, Math.min(100, 400 / selectedData.length));
    
    //     const borderSize = Math.max(1, imageSize / 30); 
    
    //     const zoomWindow = window.open('', '_blank', 'width=800,height=600');
    //     zoomWindow.document.write(`
    //     <html>
    //       <head>
    //         <title>Zoom de Puntos Seleccionados</title>
    //         <style>
    //           img { 
    //             opacity: 0.8; 
    //             transition: opacity 0.3s ease, transform 0.3s ease, z-index 0.3s ease;
    //             position: relative;
    //             border-radius: 3px;
    //           }
    //           img:hover { 
    //             opacity: 1; 
    //             transform: scale(1.2); /* Aumenta el tamaño al hacer hover */
    //             z-index: 100; /* Trae la imagen al frente */
    //           }
    //         </style>
    //       </head>
    //       <body>
    //         <div style="display:flex;flex-wrap:wrap;position:relative; height:100%; width:100%;">
    //     `);
    
    //     selectedData.forEach(d => {
    //         const scaledX = xScale(d.x);  
    //         const scaledY = yScale(d.y);  
    
    //         zoomWindow.document.write(`
    //             <div style="position:absolute; left:${scaledX}%; top:${scaledY}%; border: ${borderSize}px solid ${getColor(d.className)};">
    //                 <img src="${d.src}" alt="Imagen" style="width: ${imageSize}px; height: ${imageSize}px;">
    //             </div>
    //         `);
    //     });
    
    //     zoomWindow.document.write('</div></body></html>');
    // }
    
    function plotearPuntos(win,callback) {
        d3.json(`http://localhost:3000/predicciones/${win.selectedModel}`)
        .then(parsedData => {
            generate_points(parsedData, `Coordenadas ${win.selectedProjection}`, win);
            
            const canvas = d3.select(`#${win.id} .canva`);
            canvas.selectAll("svg").remove();

            const svg = canvas.append("svg")
                    .attr("width", "100%")
                    .attr("height", "100%");

            const width = canvas.node().clientWidth;
            const height = canvas.node().clientHeight;

            const xScale = d3.scaleLinear()
                            .domain([0, 100])
                            .range([0, width]);

            const yScale = d3.scaleLinear()
                            .domain([0, 100])
                            .range([0, height]);

            const points = svg.selectAll("circle")
                .data(win.data, d => d.fileName);

            points.enter().append("circle")
                .attr("cx", d => xScale(d.x))
                .attr("cy", d => yScale(d.y))
                .attr("r", d => globalSelectedIndices.has(d.fileName) ? SIZE_POINT_SELECTED : SIZE_POINT)
                .attr("fill", d => getColor(d[etiquetasVisualizacion]))
                .attr("opacity", d => d.probability / 100)
                .on("mouseover", function (event, d) {
                    d3.select(this)
                        .transition()
                        .duration(100)
                        .style('opacity', 0.3);

                    tooltip.transition()
                        .duration(100)
                        .style("opacity", 0.9);

                    const clases = parsedData["Nombres de las clases"];
                    // const probabilities = parsedData["Probabilidades"]
                    
                    tooltip.html(`<div style="text-align: center;">
                                <img id="tooltip-image" src="${d.src}" alt="Imagen del grano de cafe" style="width: 100px; height: 100px;">
                                <p> Clase real: ${clases[d.trueLabel]} </p>
                                <p> Clase predicha: ${clases[d.predictLabel]} </p>
                                <p> Probabilidad: ${d.probability} %</p>
                                <button id="explain-button">Explicar</button>
                              </div>`)
                            .style("left", `${event.pageX + 10}px`)
                            .style("top", `${event.pageY + 10}px`);
                })
                .on("mouseout", function (event, d) {
                    d3.select(this)
                        .transition()
                        .duration(100)
                        .style('opacity', d.probability/100);
                    tooltip.transition()
                        .duration(100)
                        .style("opacity", 0);
                })
                .on("click", function (event, d) {
                    if (globalSelectedIndices.has(d.fileName)) {
                        globalSelectedIndices.delete(d.fileName);
                    } else {
                        globalSelectedIndices.add(d.fileName);
                    }
                    updateAllWindows();
                });

            if (isBrushActive) {
                const brush = d3.brush()
                                .extent([[0, 0], [width, height]])
                                .on("end", function(event) {
                                    if (!event.selection) return;
                                    const [[x0, y0], [x1, y1]] = event.selection;

                                    const selected = win.data.filter(d => {
                                        const x = xScale(d.x);
                                        const y = yScale(d.y);
                                        return x0 <= x && x <= x1 && y0 <= y && y <= y1;
                                    }).map(d => d.fileName);

                                    selected.forEach(fileName => globalSelectedIndices.add(fileName));
                                    updateAllWindows();

                                    svg.select(".brush").call(brush.move, null);
                                });

                svg.append("g")
                    .attr("class", "brush")
                    .call(brush);
            }
            if (callback) callback();
        })
        .catch(err => {
            console.error(err);
        });
    }

    function getMetricValue(windowId, metricIndex) {
        const win = windows.find(w => w.id === windowId);
        if (!win || !win.data) return 0;
    
        const classes = ["defect", "longberry", "peaberry", "premium"];
        const numClasses = classes.length;
    
        const confusionMatrix = Array(numClasses).fill().map(() => Array(numClasses).fill(0));
        win.data.forEach(({ trueLabel, predictLabel }) => {
            confusionMatrix[trueLabel][predictLabel]++;
        });
    
        const metrics = classes.map((_, classIndex) => {
            let tp = confusionMatrix[classIndex][classIndex];
            let fp = confusionMatrix.reduce((sum, row, i) => 
                i !== classIndex ? sum + row[classIndex] : sum, 0);
            let fn = confusionMatrix[classIndex].reduce((sum, val, i) => 
                i !== classIndex ? sum + val : sum, 0);
            let tn = confusionMatrix.reduce((sum1, row, i) => 
                i !== classIndex ? sum1 + row.reduce((sum2, val, j) => 
                    j !== classIndex ? sum2 + val : sum2, 0) : sum1, 0);
    
            return {
                accuracy: (tp + tn) / (tp + tn + fp + fn) || 0,
                precision: tp / (tp + fp) || 0,
                recall: tp / (tp + fn) || 0,
                f1: tp ? (2 * tp) / (2 * tp + fp + fn) : 0
            };
        });
    
        const totalCorrect = confusionMatrix.reduce((sum, row, i) => sum + row[i], 0); 
        const totalSamples = confusionMatrix.flat().reduce((sum, val) => sum + val, 0); 

        const globalMetrics = {
            accuracy: totalCorrect / totalSamples, 
            precision: metrics.reduce((sum, m) => sum + m.precision, 0) / numClasses,
            recall: metrics.reduce((sum, m) => sum + m.recall, 0) / numClasses,
            f1: metrics.reduce((sum, m) => sum + m.f1, 0) / numClasses,
            confusionMatrix
        };
    
        switch (metricIndex) {
            case 1: return globalMetrics.accuracy.toFixed(3);
            case 2: return globalMetrics.recall.toFixed(3);
            case 3: return globalMetrics.precision.toFixed(3);
            case 4: return globalMetrics.f1.toFixed(3);
            case 5: return globalMetrics.confusionMatrix;
            default: return 0;
        }
    }
    
    function updateTable(selectedValue, windowId) {
        const panel = document.getElementById("left-panel");
        if (!panel) return;
    
        let modelContainer = panel.querySelector(`div[data-window="${windowId}"]`);
        
        if (!modelContainer) {
            const existingContainers = panel.querySelectorAll('div[data-window]');
            if (existingContainers.length >= window.NUM_WINDOWS) {
                return;
            }
    
            modelContainer = document.createElement('div');
            modelContainer.setAttribute('data-window', windowId);
            modelContainer.className = 'model-container mb-4';
            panel.appendChild(modelContainer);
        }
    
        modelContainer.innerHTML = `
            <h3 class="model-name mb-2">${selectedValue}</h3>
            <table class="metrics-table mb-2">
                <tr>
                    <th>Accuracy</th>
                    <th>Recall</th>
                    <th>Precision</th>
                    <th>F1 Score</th>
                </tr>
                <tr>
                    <td>${getMetricValue(windowId, 1)}</td>
                    <td>${getMetricValue(windowId, 2)}</td>
                    <td>${getMetricValue(windowId, 3)}</td>
                    <td>${getMetricValue(windowId, 4)}</td>
                </tr>
            </table>
        `;
    
        const confusionMatrix = getMetricValue(windowId, 5);
        if (confusionMatrix) {
            const classes = ["defect", "longberry", "peaberry", "premium"];
            let confusionTable = '<table class="confusion-matrix">';
            
            confusionTable += '<tr><th></th>';
            classes.forEach(className => {
                confusionTable += `<th>Pred ${className}</th>`;
            });
            confusionTable += '</tr>';
    
            classes.forEach((className, i) => {
                confusionTable += `<tr><th>True ${className}</th>`;
                confusionMatrix[i].forEach((value, j) => {
                    confusionTable += `<td class="confusion-cell" data-true="${i}" data-pred="${j}">${value}</td>`;
                });
                confusionTable += '</tr>';
            });
    
            confusionTable += '</table>';
            
            const matrixDiv = document.createElement('div');
            matrixDiv.className = 'confusion-matrix-container';
            matrixDiv.innerHTML = '<h4>Confusion Matrix</h4>' + confusionTable;
            modelContainer.appendChild(matrixDiv);
    
            const cells = matrixDiv.querySelectorAll('.confusion-cell');
            cells.forEach(cell => {
                cell.addEventListener('click', () => {
                    const trueIndex = parseInt(cell.getAttribute('data-true'));
                    const predIndex = parseInt(cell.getAttribute('data-pred'));
    
                    const win = windows.find(w => w.id === windowId);
                    if (!win || !win.data) return;
    
                    const associatedFiles = win.data
                        .filter(item => item.trueLabel === trueIndex && item.predictLabel === predIndex)
                        .map(item => item.fileName);
    
                    associatedFiles.forEach(fileName => {
                        if (globalSelectedIndices.has(fileName)) {
                            globalSelectedIndices.delete(fileName);
                        } else {
                            globalSelectedIndices.add(fileName);

                        }
                    });
                    
                    windows.forEach(win => {
                        plotearPuntos(win)
                    });

                    cell.classList.toggle('selected-cell');

                });
            });
        }
    }

    function updateAllWindows(callback) {
        windows.forEach(win => {
            plotearPuntos(win, () => {
                updateTable(win.selectedModel, win.id);
            });
        });
        if(callback)
            callback()
    }


    function changeModel(selectedValue,windowId){
        const win = getWindowById(windowId);
        if (win) {
            win.selectedModel = selectedValue;
            
            plotearPuntos(win, () => {
                updateTable(selectedValue, windowId);
            });

            tooltip.transition().duration(3000).style("opacity",0);
        }
    }

    function changeProjection(selectedValue,windowId){
        const win = getWindowById(windowId);
            if (win) {
                win.selectedProjection = selectedValue;
                plotearPuntos(win);
                tooltip.transition().duration(100).style("opacity",0);
            }
    }

    function initializeRadioButtons() {
        const radioButtons = document.querySelectorAll('#tipo-etiquetas input[type="radio"]');
        
        radioButtons.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    etiquetasVisualizacion = this.value === 'reales' ? 
                        "trueLabel" : "predictLabel";

                    updateAllWindows()
                }
            });
        });
    }

    initializeRadioButtons()

    document.getElementById("toggle-brush").addEventListener("click", function() {
        isBrushActive = !isBrushActive;
        this.innerText = isBrushActive ? "Desactivar Brush" : "Activar Brush";
        updateAllWindows();
    });

    document.getElementById("explain-selected").addEventListener('click', function() {
        if (globalSelectedIndices.size === 0) {
            alert('No hay puntos seleccionados.');
            return;
        }
    
        const selectedData = windows[0].data.filter(d => globalSelectedIndices.has(d.fileName));
    
        const container = document.querySelector('.right-bottom');
        if (!container) {
            alert('Contenedor no encontrado.');
            return;
        }
    
        container.style.width = '100%';      
        container.style.overflowY = 'auto';  
        container.style.overflowX = 'auto';   
        container.style.border = '1px solid #ccc';  
    
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 20px;">
                ${selectedData.map(d => `
                    <div style="display: flex; flex-direction: row; align-items: flex-start; width: max-content;">
                        <!-- Imagen Original Fija -->
                        <div style="
                            position: sticky;
                            left: 0;
                            background: white;
                            z-index: 1;
                            flex: 0 0 auto;
                            width: 110px;
                            margin-right: 20px;
                            text-align: center;
                        ">
                            <h3>Original</h3>
                            <img src="images/${d.fileName}" alt="Imagen original" style="width: 110px; height: auto;">
                        </div>
    
                        <!-- Contenedor Scrollable de Modelos -->
                        <div style="display: flex; flex-direction: row; gap: 20px;">
                            ${windows.slice(0, window.NUM_WINDOWS).map(win => `
                                <div style="
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    min-width: 110px;
                                    text-align: center;
                                ">
                                    <h3>${win.selectedModel}</h3>
                                    <div>
                                        <!-- Primera fila: LIME -->
                                        <img src="images/LIME/${win.selectedModel}/${d.fileName}" alt="Imagen explicada - LIME" style="width: 110px; height: auto;">
                                    </div>
                                    <div>
                                        <!-- Segunda fila: layer_cam -->
                                        <img src="images/layer_cam/${win.selectedModel}/${d.fileName}" alt="Imagen explicada - layer_cam" style="width: 110px; height: auto;">
                                    </div>
                                    <div>
                                        <!-- Tercera fila: score_cam -->
                                        <img src="images/score_cam/${win.selectedModel}/${d.fileName}" alt="Imagen explicada - score_cam" style="width: 110px; height: auto;">
                                    </div>
                                </div>
                            `).join('')}

                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    });

    document.getElementById("clear-selected").addEventListener('click', function() {
        globalSelectedIndices.clear();
        updateAllWindows();
    })

    function doZoomWindow(windowId){
        const win = getWindowById(windowId);
        zoomWindow(win); 
    }

    document.querySelectorAll('.zoom-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const windowId = this.getAttribute('data-window');
            doZoomWindow(windowId)
        });
    });

    let activeWindow = null;
    let initialX, initialY, initialMouseX, initialMouseY;
    let isResizing = false;
    let initialWidth, initialHeight;

    document.addEventListener('mousedown', startDragOrResize);
    document.addEventListener('mousemove', dragOrResize);
    document.addEventListener('mouseup', stopDragOrResize);

    function startDragOrResize(e) {
        if (e.target.classList.contains('window-header')) {
            activeWindow = e.target.closest('.window');
            initialX = activeWindow.offsetLeft;
            initialY = activeWindow.offsetTop;
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;
        } else if (e.target.classList.contains('resize-handle')) {
            isResizing = true;
            activeWindow = e.target.closest('.window');
            initialWidth = parseFloat(getComputedStyle(activeWindow).width);
            initialHeight = parseFloat(getComputedStyle(activeWindow).height);
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;
        }
    }

    function dragOrResize(e) {
        if (activeWindow) {
            if (!isResizing) {
                let newX = initialX + e.clientX - initialMouseX;
                let newY = initialY + e.clientY - initialMouseY;
                activeWindow.style.left = newX + 'px';
                activeWindow.style.top = newY + 'px';
            } else {
                let newWidth = initialWidth + e.clientX - initialMouseX;
                let newHeight = initialHeight + e.clientY - initialMouseY;
                activeWindow.style.width = newWidth + 'px';
                activeWindow.style.height = newHeight + 'px';
            }
        }
    }

    function stopDragOrResize() {
        activeWindow = null;
        isResizing = false;
    }

    window.updateAllWindows = updateAllWindows
    window.changeModel = changeModel
    window.changeProjection = changeProjection
    window.doZoomWindow = doZoomWindow
    window.SIZE_POINT = SIZE_POINT
    window.SIZE_POINT_SELECTED = SIZE_POINT_SELECTED
    
});


