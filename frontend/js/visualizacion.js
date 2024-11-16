document.addEventListener("DOMContentLoaded", function() {
    const SIZE_POINT = 2;
    const SIZE_POINT_SELECTED = 5;
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
    let globalSelectedIndices = new Set();
    let isBrushActive = false;

    let etiquetasVisualizacion = "trueLabel"

    const windows = [
        { id: "window1", selectedIndices: new Set(), data: [], selectedModel: "Xception", selectedProjection: "UMAP" },
        { id: "window2", selectedIndices: new Set(), data: [], selectedModel: "Xception", selectedProjection: "TSNE" },
        { id: "window3", selectedIndices: new Set(), data: [], selectedModel: "Xception", selectedProjection: "TRIMAP" },
        { id: "window4", selectedIndices: new Set(), data: [], selectedModel: "Xception", selectedProjection: "PACMAP" }
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
                fileName: data_response["Nombres de los archivos"][i]
            });
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
    
    function plotearPuntos(win) {
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
                .on("mouseover", function (event, d) {
                    d3.select(this)
                        .transition()
                        .duration(100)
                        .style('opacity', 0.3);

                    tooltip.transition()
                        .duration(100)
                        .style("opacity", 0.9);

                    const clases = parsedData["Nombres de las clases"];
                    tooltip.html(`<div style="text-align: center;">
                                <img id="tooltip-image" src="${d.src}" alt="Imagen del grano de cafe" style="width: 100px; height: 100px;">
                                <p> Clase real: ${clases[d.trueLabel]} </p>
                                <p> Clase predicha: ${clases[d.predictLabel]} </p>
                                <button id="explain-button">Explicar</button>
                              </div>`)
                            .style("left", `${event.pageX + 10}px`)
                            .style("top", `${event.pageY + 10}px`);
                })
                .on("mouseout", function () {
                    d3.select(this)
                        .transition()
                        .duration(100)
                        .style('opacity', 1);
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
        })
        .catch(err => {
            console.error(err);
        });
    }

    function updateAllWindows() {
        windows.forEach(win => {
            plotearPuntos(win);
        });
    }

    function changeModel(selectedValue,windowId){
        const win = getWindowById(windowId);
        if (win) {
            win.selectedModel = selectedValue;
            plotearPuntos(win);
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
                            ${windows.map(win => `
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
});


