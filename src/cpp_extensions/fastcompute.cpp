#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
using namespace std;

int sum_of_squares(const vector<int>& data) {
    long long total = 0;
    for (int x : data) total += x * x;
    return static_cast<int>(total);
}

PYBIND11_MODULE(fastcompute, m) {
    m.def("sum_of_squares", &sum_of_squares, "Compute sum of squares quickly in C++");
}
