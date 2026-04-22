const QUOTES = [
  'Simplicity is the ultimate sophistication. — da Vinci',
  'Make it work, make it right, make it fast. — Kent Beck',
  'Premature optimization is the root of all evil. — Knuth',
  'The best code is no code at all. — Jeff Atwood',
  'Good code is its own best documentation. — Steve McConnell',
  'Talk is cheap. Show me the code. — Linus Torvalds',
];

export default class RandomQuote extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin: 0.5rem 0;
          background: #f0f9ff;
          border-left: 4px solid #0ea5e9;
          color: #0c4a6e;
          font-style: italic;
        }
        button {
          display: inline-block;
          margin-top: 0.5rem;
          padding: 0.25rem 0.6rem;
          font-size: 0.8rem;
          cursor: pointer;
          border: 1px solid #bae6fd;
          border-radius: 4px;
          background: #fff;
          color: #0c4a6e;
          font-style: normal;
        }
        button:hover { background: #f0f9ff; border-color: #7dd3fc; }
      </style>
      <span class="quote"></span>
      <br />
      <button type="button">New quote</button>
    `;
    this.update();
    shadow.querySelector('button')!.addEventListener('click', () => this.update());
  }

  private update() {
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    this.shadowRoot!.querySelector('.quote')!.textContent = quote;
  }
}

customElements.define('random-quote', RandomQuote);
