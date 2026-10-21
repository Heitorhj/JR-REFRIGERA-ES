//tratar o erro
export default function errorHandler(error, req, res, next) {
    const statusCode = error.statusCode ?? 500;

    return res.status(statusCode).json({
        mensagem: error.message
    });
}