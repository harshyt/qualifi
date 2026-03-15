declare module 'react-quill-new' {
  import * as React from 'react';
  
  interface ReactQuillProps {
    value?: string;
    defaultValue?: string;
    readOnly?: boolean;
    theme?: string;
    modules?: unknown;
    formats?: string[];
    bounds?: string | HTMLElement;
    placeholder?: string;
    preserveWhitespace?: boolean;
    onChange?: (content: string, delta: unknown, source: string, editor: unknown) => void;
    onChangeSelection?: (range: unknown, source: string, editor: unknown) => void;
    onFocus?: (range: unknown, source: string, editor: unknown) => void;
    onBlur?: (previousRange: unknown, source: string, editor: unknown) => void;
    onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
    /** @deprecated Use onKeyDown instead. React 17+ deprecates onKeyPress. */
    onKeyPress?: React.KeyboardEventHandler<HTMLElement>;
    onKeyUp?: React.KeyboardEventHandler<HTMLElement>;
    style?: React.CSSProperties;
    className?: string;
    id?: string;
    tabIndex?: number;
  }

  export default class ReactQuill extends React.Component<ReactQuillProps> {}
}

declare module 'react-quill-new/dist/quill.snow.css';
