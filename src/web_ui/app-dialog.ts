import { css, html, LitElement } from "lit";
import {customElement, property} from "lit/decorators.js";
import {ADD_ICON, CANCEL_ICON} from "./icons";
import "./app-button";

interface DialogOptions {
    title: string;
    content: {
        type: 'text-input',
        label: string,
        validationFn?: (input: string) => boolean
    },
    action: 'add',
    callback: (text: string) => void
}

@customElement('app-dialog')
export class AppDialog extends LitElement {
    @property({type: String, reflect: true}) shown:'true'|'false' = 'false';
    @property({type: Boolean, reflect: true}) disabled = false;
    @property({type: Object, reflect: true}) options: DialogOptions|null = null;

    static override styles = css`
        :host {
            width: 100vw;
            height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            display: none;
            place-items: center;
        }
        :host([shown="true"]) {
            display: grid;
        }
        .scrim {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.2);
        }

        .dialog {
            width: 500px;
            min-height: 200px;
            padding: 16px 24px;
            background: white;
            border: 2px solid #383838;
            position: relative;
            border-radius: 8px;
            font-family: 'Ubuntu';
            display: flex;
            flex-direction: column;
        }

        .dialog::before {
            content: '';
            width: 100%;
            height: 100%;
            background: #383838;
            position: absolute;
            top: 8px;
            left: 8px;
            border-radius: 8px;
            z-index: -1;
        }

        .dialog h1 {
            color: #383838;
        }
        .dialog .content {
            flex-grow: 1;
        }
        .dialog .actions {
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            z-index: 0;
        }
        .dialog .actions app-button:not(:last-child) {
            margin-right: 12px;
        }
        .content {
            display: flex;
            align-items: flex-start;
            justify-content: center;
            flex-direction: column;
        }
        .content label {
            font-size: 12px;
            color: #BBB6B6;
            padding-bottom: 6px;
            font-weight: bold;
        }
        .content input[type="text"] {
            width: 100%;
            background: #E5E5E5;
            border-radius: 6px;
            height: 32px;
            border: none;
            outline: none;
            box-sizing: border-box;
            padding: 8px 12px;
            color: #383838;
            font-weight: bold;
        }
    `;
    
    show(options: DialogOptions) {
        this.options = options;
        this.shown = 'true';
        if (this.options.content.type === 'text-input') {
            this.updateComplete.then(() => {
                const input = this.renderRoot.querySelector('input')!;
                input.value = '';
                input.focus();
            });
            if (this.options.content.validationFn) {
                this.disabled = !this.options.content.validationFn('');
            }
        }
        
    }

    hide() {
        this.shown = 'false';
    }

    doAction() {
        if (this.disabled || this.shown === 'false') {
            return;
        }
        if (this.options.content.type === 'text-input') {
            const text = this.renderRoot.querySelector('input').value;
            this.options.callback(text);
        }
        this.hide();
    }

    validate() {
        const {content} = this.options;
        if (content.type === 'text-input' && content.validationFn) {
            const text = this.renderRoot.querySelector('input').value;
            this.disabled = !content.validationFn(text);
        }
    }

    onKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            this.hide();
        } else if (e.key === 'Enter') {
            this.doAction();
        }
    }

    render() {
      if (!this.options) {
        return '';
      }
      let content;
      if (this.options.content.type === 'text-input') {
        content = html`
            <label>${this.options.content.label}</label>
            <input @input=${() => this.validate()} type="text"/>
        `;
      }
      let actionIcon;
      let actionText;
      if (this.options.action === 'add') {
        actionIcon = ADD_ICON;
        actionText = 'Add';
      }
      
      return html`
        <div class="scrim" @click=${() => this.hide()}></div>
        <div class="dialog" @keydown=${(e) => this.onKeydown(e)}>
            <h1> ${this.options.title} </h1>
            <div class="content">
                ${content}
            </div>
            <div class="actions">
                <app-button
                    @click=${() => this.doAction()}
                    ?disabled=${this.disabled}
                    primary
                    .icon=${actionIcon}
                    text=${actionText}
                ></app-button>
                <app-button
                    @click=${() => this.hide()}
                    .icon=${CANCEL_ICON}
                    text="Cancel"
                ></app-button>
            </div>
        </div>
      `;
    }
  }