class ClickSpark extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
          z-index: 999999;
        }
        .spark-svg {
          position: absolute;
          pointer-events: none;
          transform: translate(-50%, -50%);
        }
      </style>
    `;
  }

  get sparkColor() {
    return this.getAttribute("spark-color") || this.getAttribute("sparkColor") || "#ffffff";
  }

  get sparkSize() {
    return parseInt(this.getAttribute("spark-size") || this.getAttribute("sparkSize")) || 10;
  }

  get sparkRadius() {
    return parseInt(this.getAttribute("spark-radius") || this.getAttribute("sparkRadius")) || 15;
  }

  get sparkCount() {
    return parseInt(this.getAttribute("spark-count") || this.getAttribute("sparkCount")) || 8;
  }

  get duration() {
    return parseInt(this.getAttribute("duration")) || 400;
  }

  get easing() {
    return this.getAttribute("easing") || "ease-out";
  }

  get extraScale() {
    return parseFloat(this.getAttribute("extra-scale") || this.getAttribute("extraScale")) || 1.0;
  }

  connectedCallback() {
    this._parent = this.parentNode || document.body;
    
    // Ensure parent has position: relative or absolute so absolute centering works perfectly
    if (this._parent !== document.body) {
      const computedStyle = window.getComputedStyle(this._parent);
      if (computedStyle.position === "static") {
        this._parent.style.position = "relative";
      }
    }
    
    this._parent.addEventListener("click", this);
  }

  disconnectedCallback() {
    if (this._parent) {
      this._parent.removeEventListener("click", this);
    }
  }

  handleEvent(e) {
    this.createSpark(e);
  }

  createSpark(e) {
    const rect = this._parent.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const count = this.sparkCount;
    const color = this.sparkColor;
    const size = this.sparkSize;
    const radius = this.sparkRadius;
    const duration = this.duration;
    const easing = this.easing;
    const extraScale = this.extraScale;

    // SVG size is determined by how far the sparks will travel
    const svgSize = (radius + size) * 2 * extraScale;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "spark-svg");
    svg.setAttribute("width", svgSize.toString());
    svg.setAttribute("height", svgSize.toString());
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.style.left = `${x}px`;
    svg.style.top = `${y}px`;

    // Create individual spark lines
    for (let i = 0; i < count; i++) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      // Lines start from the center (50, 50) and point upwards (50, 50 - size)
      line.setAttribute("x1", "50");
      line.setAttribute("y1", "50");
      line.setAttribute("x2", "50");
      line.setAttribute("y2", (50 - size).toString());
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", "4");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("stroke-dasharray", size.toString());
      line.setAttribute("stroke-dashoffset", size.toString());
      line.style.transformOrigin = "50px 50px";
      svg.appendChild(line);
    }

    this.shadowRoot.appendChild(svg);

    // Animate each spark radiating outward from the center
    const sparks = [...svg.children];
    sparks.forEach((spark, i) => {
      const deg = `${(i * 360) / count}deg`;
      
      // We animate from slightly outside the center to the full travel distance (radius * extraScale)
      // and animate the dash offset from size (hidden) to -size (hidden, fully moved past)
      spark.animate(
        [
          {
            strokeDashoffset: size,
            transform: `rotate(${deg}) translateY(-${radius * 0.2}px) scale(1)`,
          },
          {
            strokeDashoffset: -size,
            transform: `rotate(${deg}) translateY(-${radius * extraScale}px) scale(0.5)`,
          },
        ],
        {
          duration: duration,
          easing: easing,
          fill: "forwards",
        }
      );
    });

    // Clean up SVG after the animation completes
    setTimeout(() => {
      svg.remove();
    }, duration);
  }
}

customElements.define("click-spark", ClickSpark);
