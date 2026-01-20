declare module 'swagger-ui-react' {
    import * as React from 'react';

    export interface SwaggerUIProps {
        url?: string;
        spec?: object;
        layout?: string;
        docExpansion?: "list" | "full" | "none";
        // Add other props as needed
    }

    class SwaggerUI extends React.Component<SwaggerUIProps> { }

    export default SwaggerUI;
}
