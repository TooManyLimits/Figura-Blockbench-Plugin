module.exports = {
	mode: 'development',
	devtool: false,
	entry: './src/figura.ts',
	module: {
		rules: [{
			test: /\.ts$/,
			use: 'ts-loader',
			exclude: /node_modules/
		},
		{
			test: /\.css$/i,
			use: ["style-loader", "css-loader"]
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
