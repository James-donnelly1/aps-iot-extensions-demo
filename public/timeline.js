function debounce(func, timeout = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

export function initTimeline(container, onTimeRangeChanged, onTimeMarkerChanged) {
    return new Promise(function (resolve, reject) {
        // Add a timeout to prevent hanging
        const timeoutId = setTimeout(() => {
            reject(new Error('Timeline initialization timeout after 10 seconds'));
        }, 10000);
        
        try {
            // Check if ChronosEtu is available
            if (typeof ChronosEtu === 'undefined') {
                clearTimeout(timeoutId);
                console.error('ChronosEtu library is not loaded');
                reject(new Error('ChronosEtu library is not loaded'));
                return;
            }

            let timeslider = new ChronosEtu.TimeSlider(container.clientWidth, container.clientHeight, '2022-01-01', '2022-02-01');
            
            window.addEventListener('resize', () => {
                if (timeslider && typeof timeslider.resize === 'function') {
                    const { clientWidth, clientHeight } = container;
                    timeslider.resize(clientWidth, clientHeight);
                }
            });
            
            timeslider.on('appready', () => {
                try {
                    timeslider.off('appready');
                    
                    // Check if timeslider is still valid and has the view method
                    if (!timeslider) {
                        clearTimeout(timeoutId);
                        console.error('Timeline object is null or undefined');
                        reject(new Error('Timeline object is null or undefined'));
                        return;
                    }
                    
                    if (typeof timeslider.view !== 'function') {
                        clearTimeout(timeoutId);
                        console.error('Timeline view method is not available');
                        reject(new Error('Timeline view method is not available'));
                        return;
                    }
                    
                    // Additional safety check - try to access the view property first
                    let view = null;
                    try {
                        view = timeslider.view();
                    } catch (viewError) {
                        clearTimeout(timeoutId);
                        console.error('Error calling timeline.view():', viewError);
                        reject(new Error('Timeline view() method failed: ' + viewError.message));
                        return;
                    }
                    
                    if (view && view.nodeType) {
                        clearTimeout(timeoutId);
                        container.appendChild(view);
                        resolve(timeslider);
                    } else {
                        clearTimeout(timeoutId);
                        console.error('Timeline view is null, undefined, or not a valid DOM element');
                        reject(new Error('Timeline view is not valid'));
                    }
                } catch (error) {
                    clearTimeout(timeoutId);
                    console.error('Error in timeline appready handler:', error);
                    reject(error);
                }
            });
            
            // Add error handler for timeline initialization
            timeslider.on('error', (error) => {
                clearTimeout(timeoutId);
                console.error('Timeline error:', error);
                reject(error);
            });
            
            timeslider.on('tscreated', debounce((ev) => onTimeRangeChanged(new Date(ev.start), new Date(ev.end))));
            timeslider.on('tsmodifying', debounce((ev) => onTimeRangeChanged(new Date(ev.start), new Date(ev.end))));
            timeslider.on('tsmodified', debounce((ev) => onTimeRangeChanged(new Date(ev.start), new Date(ev.end))));
            timeslider.on('timemarkerchanged', debounce((ev) => onTimeMarkerChanged(new Date(ev.time))));
            timeslider.on('playbackmarkerchanged', (ev) => onTimeMarkerChanged(new Date(ev.time)));
            
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error initializing timeline:', error);
            reject(error);
        }
    });
}
