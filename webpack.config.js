module.exports = {
	mode: 'development',
	devtool: false,
	entry: './src/figura.ts',
	module: {
		rules: [{
			test: /\.ts$/,
			use: 'ts-loader',
			exclude: /node_modules/
		}]
	},
	resolve: {
		extensions: ['.ts']
	},
	output: {
		filename: 'figura.js',
		path: __dirname
	},
}
