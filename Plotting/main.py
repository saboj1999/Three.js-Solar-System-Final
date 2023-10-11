import numpy as np
import matplotlib.pyplot as plt
import os
import shutil
import time


def read_planet_file(filename):
    file = open(filename)
    file.readline()
    number_of_steps = 0
    distance_to_sun = []
    temperature = []
    planet_name = ""
    for line in file:
        name, temp, time_step, distance = line.strip().split(",")
        number_of_steps += 1
        distance_to_sun.append(float(distance))
        if filename == "Brown Dwarf.txt":
            temperature.append(1000)
        else:
            temperature.append(float(temp))
        if planet_name == "":
            planet_name = name
    time_line = np.linspace(1, number_of_steps, number_of_steps)
    return planet_name, temperature, time_line, distance_to_sun


def read_planet_file_and_normalize(filename):
    file = open(filename)
    file.readline()
    number_of_steps = 0
    distance_to_sun = []
    temperature = []
    planet_name = ""
    initial_temp = 0
    initial_distance = 0
    for line in file:
        name, temp, time_step, distance = line.strip().split(",")
        number_of_steps += 1
        if number_of_steps == 1:
            initial_temp = temp
            initial_distance = distance
        distance_to_sun.append(float(distance) / float(initial_distance))
        if filename == "Brown Dwarf.txt":
            temperature.append(2)
        else:
            temperature.append(float(temp) / float(initial_temp))
        if planet_name == "":
            planet_name = name
    time_line = np.linspace(1, number_of_steps, number_of_steps)
    return planet_name, temperature, time_line, distance_to_sun


def plot_temp_data(filename, color):
    planet_name, temperature, time_line, distance_to_sun = read_planet_file(
        filename)  # read_planet_file_and_normalize(filename)
    plt.plot(time_line, temperature, c=color, label=planet_name)


def plot_distance_data(filename, color):
    planet_name, temperature, time_line, distance_to_sun = read_planet_file(
        filename)  # read_planet_file_and_normalize(filename)
    plt.plot(time_line, distance_to_sun, c=color, label=planet_name)


def main():
    file_color_combo = {"Mercury.txt": "yellow", "Venus.txt": "orange", "Earth.txt": "green", "Mars.txt": "red",
                        "Jupiter.txt": "purple", "Saturn.txt": "grey", "Uranus.txt": "black",
                        "Neptune.txt": "blue", "Pluto.txt": "magenta", "Brown Dwarf.txt": "brown"}
    filenames = ["Mercury.txt", "Venus.txt", "Earth.txt", "Mars.txt",
                 "Jupiter.txt", "Saturn.txt", "Uranus.txt", "Neptune.txt", "Pluto.txt", "Brown Dwarf.txt"]

    downloads_folder = '/Users/saboj@moravian.edu/Downloads'
    project_folder = '/Users/saboj@moravian.edu/Desktop/Three.js-Solar-System/Plotting'

    current_time = time.time()

    txt_files = [f for f in os.listdir(downloads_folder) if f.endswith('.txt')]

    for txt_file in txt_files:
        src = os.path.join(downloads_folder, txt_file)
        c_time = os.path.getctime(src)
        if current_time - c_time <= 86400:
            dst = os.path.join(project_folder, txt_file)
            shutil.move(src, dst)
            print(f"Moved {txt_file} to {project_folder} and overwrote any existing file.")

    for filename in filenames:
        plot_temp_data(filename, file_color_combo[filename])
    plt.title("Temperature of Planets")
    plt.legend()
    plt.show()

    for filename in filenames:
        plot_distance_data(filename, file_color_combo[filename])
    plt.title("Distance to Sun")
    plt.legend()
    plt.show()


if __name__ == "__main__":
    main()
