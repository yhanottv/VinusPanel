module.exports = {
    plugins: [
        require('postcss-import'),
        // We want to make use of nesting following the CSS Nesting spec, and not the
        // SASS style nesting.
        //
        // @see https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-nesting
        require('tailwindcss/nesting')(require('postcss-nesting')),
        require('tailwindcss'),
        require('autoprefixer'),
        require('postcss-preset-env')({
            features: {
                'nesting-rules': false,
                // VinusPanel s'appuie sur :has() natif. Le polyfill produit des
                // selecteurs d'attribut echappes ([\:has\(...\)]) que l'ancien
                // css-loader embarque par Blueprint ne sait pas analyser. On le
                // desactive : les navigateurs modernes prennent :has() en charge.
                'has-pseudo-class': false,
            },
        }),
    ],
};
